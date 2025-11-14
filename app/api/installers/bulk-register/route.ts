import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Installer, { IInstaller } from '@/models/Installer';
import Activity from '@/models/Activity';
import { createGoogleContact } from '@/lib/googleContacts';

interface BulkInstallerData extends Partial<IInstaller> {
  isValid?: boolean;
}

interface BulkUploadResults {
  success: number;
  failed: number;
  errors: string[];
  duplicates: string[];
  successfulCodes: string[];
  googleContactsCreated: number;
  googleContactsFailed: number;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { installers } = body;

    if (!installers || !Array.isArray(installers) || installers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No installers provided' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent timeout
    if (installers.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Maximum 500 installers per upload. Please split your file.' },
        { status: 400 }
      );
    }

    const results: BulkUploadResults = {
      success: 0,
      failed: 0,
      errors: [],
      duplicates: [],
      successfulCodes: [],
      googleContactsCreated: 0,
      googleContactsFailed: 0,
    };

    // Validate that all installers have required fields
    for (let i = 0; i < installers.length; i++) {
      const inst = installers[i];
      if (!inst.installerCode || !inst.fullName || !inst.cnic) {
        results.errors.push(`Row ${i + 1}: Missing required fields (installerCode, fullName, or cnic)`);
        results.failed++;
      }
    }

    // If validation failed, return early
    if (results.failed > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', data: results },
        { status: 400 }
      );
    }

    // Only process valid installers (those without frontend validation issues)
    const validInstallers = installers.filter((i: BulkInstallerData) => i.isValid !== false);

    if (validInstallers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid installers to upload', data: results },
        { status: 400 }
      );
    }

    // Pre-fetch all existing referrers at once for performance
    const referrerCodes = validInstallers
      .map((i: BulkInstallerData) => i.referrerCode)
      .filter((code): code is string => !!code);

    const uniqueReferrerCodes = [...new Set(referrerCodes)];
    const referrers = await Installer.find(
      { installerCode: { $in: uniqueReferrerCodes } },
      { installerCode: 1, _id: 1 }
    ).lean();

    const referrerMap = new Map(
      referrers.map((r) => [r.installerCode, r._id.toString()])
    );

    // Prepare installer documents for batch insert
    const installersToInsert = [];
    const installerValidationErrors: { code: string; error: string }[] = [];

    for (const installerData of validInstallers) {
      // Validate required fields one more time
      if (!installerData.phoneNumber || !installerData.whatsappNumber ||
          !installerData.address || !installerData.city || !installerData.province ||
          !installerData.trainingCenter || !installerData.bankName ||
          !installerData.accountNumber || !installerData.accountTitle) {
        installerValidationErrors.push({
          code: installerData.installerCode || 'unknown',
          error: 'Missing required fields'
        });
        continue;
      }

      // Handle referrer if provided
      let referrerId = null;
      if (installerData.referrerCode) {
        referrerId = referrerMap.get(installerData.referrerCode);
        if (!referrerId) {
          installerValidationErrors.push({
            code: installerData.installerCode || 'unknown',
            error: `Referrer code not found: ${installerData.referrerCode}`
          });
          continue;
        }
      }

      // Prepare installer document
      installersToInsert.push({
        installerCode: installerData.installerCode,
        fullName: installerData.fullName,
        referrerCode: installerData.referrerCode,
        referrer: referrerId,
        cnic: installerData.cnic,
        phoneNumber: installerData.phoneNumber,
        whatsappNumber: installerData.whatsappNumber,
        address: installerData.address,
        city: installerData.city,
        province: installerData.province,
        trainingCenter: installerData.trainingCenter,
        companyName: installerData.companyName,
        bankName: installerData.bankName,
        accountNumber: installerData.accountNumber,
        accountTitle: installerData.accountTitle,
        certified: installerData.certified || false,
        registeredBy: session.user.id,
      });
    }

    // Add validation errors to results
    installerValidationErrors.forEach(({ code, error }) => {
      results.errors.push(`Installer ${code}: ${error}`);
      results.failed++;
    });

    // Batch insert installers (ordered: false to continue on duplicates)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let insertedInstallers: any[] = [];
    if (installersToInsert.length > 0) {
      try {
        // Without rawResult, insertMany returns the inserted documents directly
        insertedInstallers = await Installer.insertMany(installersToInsert, {
          ordered: false,
        }) as any[];

        results.success += insertedInstallers.length;
        insertedInstallers.forEach((installer) => {
          results.successfulCodes.push(installer.installerCode);
        });
      } catch (err: unknown) {
        console.error('Bulk insert error:', err);

        // Handle Mongoose bulk write errors
        if (err && typeof err === 'object' && 'writeErrors' in err) {
          // Get the successfully inserted documents from the error
          // Mongoose returns the docs that were inserted before the error
          const bulkError = err as any;

          if (Array.isArray(bulkError.insertedDocs)) {
            insertedInstallers = bulkError.insertedDocs;
          } else if (bulkError.result && Array.isArray(bulkError.result.insertedDocs)) {
            insertedInstallers = bulkError.result.insertedDocs;
          }

          results.success += insertedInstallers.length;
          insertedInstallers.forEach((installer) => {
            results.successfulCodes.push(installer.installerCode);
          });

          // Process write errors
          if (Array.isArray(bulkError.writeErrors)) {
            bulkError.writeErrors.forEach((writeErr: any) => {
              const failedDoc = writeErr.err?.op || writeErr.op;
              const errorMessage = writeErr.err?.errmsg || writeErr.errmsg || 'Unknown error';
              const errorCode = writeErr.err?.code || writeErr.code;

              if (errorMessage.includes('duplicate key') || errorCode === 11000) {
                if (errorMessage.includes('installerCode')) {
                  results.errors.push(`Installer code "${failedDoc.installerCode}" already exists`);
                } else if (errorMessage.includes('cnic')) {
                  results.errors.push(`CNIC "${failedDoc.cnic}" already exists`);
                } else {
                  results.errors.push(`Duplicate entry for ${failedDoc.installerCode}`);
                }
              } else {
                results.errors.push(`Failed to create ${failedDoc.installerCode}: ${errorMessage}`);
              }
              results.failed++;
            });
          }
        } else {
          // Fallback for unexpected errors
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          results.errors.push(`Batch insert failed: ${errorMessage}`);
          results.failed += installersToInsert.length;
        }
      }
    }

    // Batch create activities for successfully inserted installers
    if (insertedInstallers.length > 0) {
      const activities = insertedInstallers.map((installer) => ({
        type: 'INSTALLER_REGISTERED',
        description: `Registered installer ${installer.fullName} (${installer.installerCode}) via bulk upload`,
        performedBy: session.user.id,
        targetType: 'Installer',
        targetId: installer._id,
        metadata: {
          code: installer.installerCode,
          name: installer.fullName,
          cnic: installer.cnic,
          city: installer.city,
          method: 'bulk_upload',
        },
      }));

      try {
        await Activity.insertMany(activities, { ordered: false });
      } catch (activityErr) {
        console.error('Failed to create some activity logs:', activityErr);
        // Don't fail the operation if activity logging fails
      }
    }

    // Process Google Contacts for successfully inserted installers
    // Keep sequential as it's an external API
    for (const installer of insertedInstallers) {
      try {
        const googleContactId = await createGoogleContact({
          fullName: installer.fullName,
          phoneNumber: installer.phoneNumber,
          whatsappNumber: installer.whatsappNumber,
          address: installer.address,
          city: installer.city,
          province: installer.province,
          companyName: installer.companyName,
          installerCode: installer.installerCode,
          referrerCode: installer.referrerCode,
          cnic: installer.cnic,
          trainingCenter: installer.trainingCenter,
        });

        // Batch update googleContactId later if needed
        if (googleContactId) {
          // Update in memory for potential batch update
          installer.googleContactId = googleContactId;
        }

        results.googleContactsCreated++;
      } catch (googleErr) {
        console.error(`Failed to create Google contact for ${installer.installerCode}:`, googleErr);
        results.googleContactsFailed++;
        // Don't fail the entire operation if Google contact creation fails
      }
    }

    // Batch update Google Contact IDs
    const installersWithGoogleIds = insertedInstallers.filter(i => i.googleContactId);
    if (installersWithGoogleIds.length > 0) {
      try {
        const bulkOps = installersWithGoogleIds.map(installer => ({
          updateOne: {
            filter: { _id: installer._id },
            update: { $set: { googleContactId: installer.googleContactId } }
          }
        }));
        await Installer.bulkWrite(bulkOps);
      } catch (updateErr) {
        console.error('Failed to update some Google Contact IDs:', updateErr);
        // Don't fail the operation if Google ID update fails
      }
    }

    // Return results with detailed summary
    const response = {
      success: results.success > 0,
      message: results.success > 0
        ? `Successfully uploaded ${results.success} of ${validInstallers.length} installer(s)`
        : 'No installers were uploaded successfully',
      data: {
        ...results,
        summary: {
          total: validInstallers.length,
          successful: results.success,
          failed: results.failed,
          successRate: validInstallers.length > 0
            ? Math.round((results.success / validInstallers.length) * 100)
            : 0,
        },
      },
    };

    if (results.success === 0) {
      return NextResponse.json(response, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to upload installers' },
      { status: 500 }
    );
  }
}
