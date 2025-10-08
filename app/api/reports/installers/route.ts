import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import * as XLSX from 'xlsx';
import dbConnect from '@/lib/mongodb';
import Installer, { IInstaller } from '@/models/Installer';
import { ITeamMember } from '@/models/TeamMember';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { FilterQuery } from 'mongoose';

// Type for populated installer document
interface PopulatedInstaller extends Omit<IInstaller, 'registeredBy' | 'referrer'> {
  registeredBy: Pick<ITeamMember, 'name' | 'email'>;
  referrer?: Pick<IInstaller, 'installerCode' | 'fullName'>;
  createdAt: Date;
}

// Type for Excel export data
interface ExcelInstallerData {
  'Installer Code': string;
  'Full Name': string;
  'CNIC': string;
  'Phone Number': string;
  'WhatsApp Number': string;
  'Address': string;
  'City': string;
  'Province': string;
  'Training Center': string;
  'Company Name': string;
  'Bank Name': string;
  'Account Number': string;
  'Account Title': string;
  'Certified': string;
  'Referrer Code': string;
  'Registered By': string;
  'Registration Date': string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const city = searchParams.get('city');
    const province = searchParams.get('province');
    const certified = searchParams.get('certified');

    const query: FilterQuery<IInstaller> = {};

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (province) {
      query.province = { $regex: province, $options: 'i' };
    }

    if (certified !== null && certified !== undefined) {
      query.certified = certified === 'true';
    }

    const installers = await Installer.find(query)
      .populate('registeredBy', 'name email')
      .populate('referrer', 'installerCode fullName')
      .sort({ createdAt: -1 });

    if (format === 'excel') {
      // Create Excel workbook
      const workbook = XLSX.utils.book_new();

      // Prepare data for Excel
      const excelData: ExcelInstallerData[] = installers.map((installer) => {
        const populatedInstaller = installer as unknown as PopulatedInstaller;
        return {
          'Installer Code': populatedInstaller.installerCode,
          'Full Name': populatedInstaller.fullName,
          'CNIC': populatedInstaller.cnic,
          'Phone Number': populatedInstaller.phoneNumber,
          'WhatsApp Number': populatedInstaller.whatsappNumber,
          'Address': populatedInstaller.address,
          'City': populatedInstaller.city,
          'Province': populatedInstaller.province,
          'Training Center': populatedInstaller.trainingCenter,
          'Company Name': populatedInstaller.companyName || '',
          'Bank Name': populatedInstaller.bankName,
          'Account Number': populatedInstaller.accountNumber,
          'Account Title': populatedInstaller.accountTitle,
          'Certified': populatedInstaller.certified ? 'Yes' : 'No',
          'Referrer Code': populatedInstaller.referrerCode || 'N/A',
          'Registered By': populatedInstaller.registeredBy?.name || 'N/A',
          'Registration Date': new Date(populatedInstaller.createdAt).toLocaleDateString(),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Installers');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new Response(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=installers_report_${Date.now()}.xlsx`,
        },
      });
    }

    return ApiResponse.success({
      total: installers.length,
      installers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
