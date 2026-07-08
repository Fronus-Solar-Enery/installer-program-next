import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import ExcelJS from 'exceljs';
import dbConnect from '@/lib/mongodb';
import Installer, { IInstaller } from '@/models/Installer';
import { ITeamMember } from '@/models/TeamMember';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { escapeRegex } from '@/lib/queryBuilder';
import { getBankLabel } from '@/lib/constants';
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
  'District': string;
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
      query.city = { $regex: escapeRegex(city), $options: 'i' };
    }

    if (province) {
      query.province = { $regex: escapeRegex(province), $options: 'i' };
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
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Installers');

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
          'District': populatedInstaller.district,
          'Company Name': populatedInstaller.companyName || '',
          'Bank Name': getBankLabel(populatedInstaller.bankName),
          'Account Number': populatedInstaller.accountNumber,
          'Account Title': populatedInstaller.accountTitle,
          'Certified': populatedInstaller.certified ? 'Yes' : 'No',
          'Referrer Code': populatedInstaller.referrerCode || 'N/A',
          'Registered By': populatedInstaller.registeredBy?.name || 'N/A',
          'Registration Date': new Date(populatedInstaller.createdAt).toLocaleDateString(),
        };
      });

      worksheet.columns = [
        'Installer Code', 'Full Name', 'CNIC', 'Phone Number', 'WhatsApp Number',
        'Address', 'City', 'Province', 'District', 'Company Name',
        'Bank Name', 'Account Number', 'Account Title', 'Certified',
        'Referrer Code', 'Registered By', 'Registration Date',
      ].map((header) => ({ header, key: header }));
      worksheet.addRows(excelData);

      // Generate Excel file
      const excelBuffer = await workbook.xlsx.writeBuffer();

      return new Response(Buffer.from(excelBuffer), {
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
