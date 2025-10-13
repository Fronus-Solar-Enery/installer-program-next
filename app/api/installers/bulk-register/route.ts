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

    // Process each installer
    for (const installerData of validInstallers) {
      try {
        // Validate required fields one more time
        if (!installerData.phoneNumber || !installerData.whatsappNumber ||
            !installerData.address || !installerData.city || !installerData.province ||
            !installerData.trainingCenter || !installerData.bankName ||
            !installerData.accountNumber || !installerData.accountTitle) {
          results.errors.push(`Installer ${installerData.installerCode}: Missing required fields`);
          results.failed++;
          continue;
        }

        // Handle referrer if provided
        let referrerId = null;
        if (installerData.referrerCode) {
          const referrer = await Installer.findOne({
            installerCode: installerData.referrerCode
          });

          if (!referrer) {
            results.errors.push(`Referrer code not found for ${installerData.installerCode}: ${installerData.referrerCode}`);
            results.failed++;
            continue;
          }
          referrerId = referrer._id;
        }

        // Create installer
        const newInstaller = await Installer.create({
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

        // Log activity
        await Activity.create({
          type: 'INSTALLER_REGISTERED',
          description: `Registered installer ${newInstaller.fullName} (${newInstaller.installerCode}) via bulk upload`,
          performedBy: session.user.id,
          targetType: 'Installer',
          targetId: newInstaller._id,
          metadata: {
            code: newInstaller.installerCode,
            name: newInstaller.fullName,
            cnic: newInstaller.cnic,
            city: newInstaller.city,
            method: 'bulk_upload',
          },
        });

        results.success++;
        results.successfulCodes.push(newInstaller.installerCode);

        // Try to create Google Contact (non-blocking)
        try {
          const googleContactId = await createGoogleContact(session.user.id, {
            fullName: newInstaller.fullName,
            phoneNumber: newInstaller.phoneNumber,
            whatsappNumber: newInstaller.whatsappNumber,
            address: newInstaller.address,
            city: newInstaller.city,
            province: newInstaller.province,
            companyName: newInstaller.companyName,
            installerCode: newInstaller.installerCode,
            referrerCode: newInstaller.referrerCode,
            cnic: newInstaller.cnic,
          });

          // Save googleContactId to installer if created successfully
          if (googleContactId) {
            newInstaller.googleContactId = googleContactId;
            await newInstaller.save();
          }

          results.googleContactsCreated++;
        } catch (googleErr) {
          console.error(`Failed to create Google contact for ${newInstaller.installerCode}:`, googleErr);
          results.googleContactsFailed++;
          // Don't fail the entire operation if Google contact creation fails
        }
      } catch (err: unknown) {
        results.failed++;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        // Provide more specific error messages
        if (errorMessage.includes('duplicate key') || errorMessage.includes('E11000')) {
          if (errorMessage.includes('installerCode')) {
            results.errors.push(`Installer code "${installerData.installerCode}" already exists`);
          } else if (errorMessage.includes('cnic')) {
            results.errors.push(`CNIC "${installerData.cnic}" already exists`);
          } else {
            results.errors.push(`Duplicate entry for ${installerData.installerCode}`);
          }
        } else if (errorMessage.includes('validation failed')) {
          results.errors.push(`Validation failed for ${installerData.installerCode}: ${errorMessage}`);
        } else {
          results.errors.push(`Failed to create ${installerData.installerCode}: ${errorMessage}`);
        }
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
