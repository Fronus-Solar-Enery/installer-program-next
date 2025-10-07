import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Installer from '@/models/Installer';

interface InstallerUpload {
  installerCode: string;
  fullName: string;
  referrerCode?: string;
  cnic: string;
  phoneNumber: string;
  whatsappNumber: string;
  address: string;
  city: string;
  province: string;
  trainingCenter: string;
  companyName?: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  certified: boolean;
  issues: string[];
  isValid: boolean;
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

    const { installers } = await req.json();

    if (!installers || !Array.isArray(installers) || installers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No installers provided' },
        { status: 400 }
      );
    }

    // Fetch all existing installer codes and CNICs for validation
    const existingInstallers = await Installer.find(
      {},
      { installerCode: 1, cnic: 1, _id: 0 }
    ).lean();

    const existingCodes = new Set(
      existingInstallers.map((i: any) => i.installerCode.toUpperCase())
    );
    const existingCNICs = new Set(
      existingInstallers.map((i: any) => i.cnic)
    );

    // Get all unique referrer codes from uploaded data
    const referrerCodes = new Set(
      installers
        .map((i: InstallerUpload) => i.referrerCode)
        .filter((code): code is string => !!code)
        .map(code => code.toUpperCase())
    );

    // Fetch valid referrer codes from database
    const validReferrers = await Installer.find(
      { installerCode: { $in: Array.from(referrerCodes) } },
      { installerCode: 1, _id: 0 }
    ).lean();

    const validReferrerCodes = new Set(
      validReferrers.map((r: any) => r.installerCode.toUpperCase())
    );

    // Track codes and CNICs in the current upload batch for duplicate detection
    const codesInBatch = new Map<string, number>();
    const cnicsInBatch = new Map<string, number>();

    // Validate each installer
    const validatedInstallers: InstallerUpload[] = installers.map(
      (installer: InstallerUpload, index: number) => {
        const newIssues: string[] = [...installer.issues];
        const code = installer.installerCode.toUpperCase();
        const cnic = installer.cnic;

        // Check for duplicate installer code in database
        if (existingCodes.has(code)) {
          newIssues.push(`Installer code "${installer.installerCode}" already exists in database`);
        }

        // Check for duplicate installer code in the upload batch
        if (codesInBatch.has(code)) {
          const firstOccurrence = codesInBatch.get(code)! + 1;
          newIssues.push(
            `Duplicate installer code in upload (first occurrence at row ${firstOccurrence})`
          );
        } else {
          codesInBatch.set(code, index);
        }

        // Check for duplicate CNIC in database
        if (existingCNICs.has(cnic)) {
          newIssues.push(`CNIC "${installer.cnic}" already exists in database`);
        }

        // Check for duplicate CNIC in the upload batch
        if (cnicsInBatch.has(cnic)) {
          const firstOccurrence = cnicsInBatch.get(cnic)! + 1;
          newIssues.push(
            `Duplicate CNIC in upload (first occurrence at row ${firstOccurrence})`
          );
        } else {
          cnicsInBatch.set(cnic, index);
        }

        // Validate referrer code if provided
        if (installer.referrerCode) {
          const refCode = installer.referrerCode.toUpperCase();

          // Check if referrer code matches installer's own code
          if (refCode === code) {
            newIssues.push('Referrer code cannot be the same as installer code');
          }
          // Check if referrer exists in database or in current batch
          else if (!validReferrerCodes.has(refCode)) {
            // Check if it's in the current batch and comes before this installer
            const refIndexInBatch = Array.from(codesInBatch.entries())
              .find(([c, _]) => c === refCode)?.[1];

            if (refIndexInBatch === undefined || refIndexInBatch > index) {
              newIssues.push(
                `Referrer code "${installer.referrerCode}" does not exist (or comes after this entry in the batch)`
              );
            }
          }
        }

        return {
          ...installer,
          issues: newIssues,
          isValid: newIssues.length === 0,
        };
      }
    );

    const validCount = validatedInstallers.filter(i => i.isValid).length;
    const invalidCount = validatedInstallers.filter(i => !i.isValid).length;

    return NextResponse.json({
      success: true,
      data: {
        validatedInstallers,
        summary: {
          total: validatedInstallers.length,
          valid: validCount,
          invalid: invalidCount,
        },
      },
    });
  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to validate installers' },
      { status: 500 }
    );
  }
}
