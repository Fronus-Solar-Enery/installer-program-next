import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import * as XLSX from 'xlsx';
import dbConnect from '@/lib/mongodb';
import Installer from '@/models/Installer';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';


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

    const query: any = {};

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
      const excelData = installers.map((installer) => ({
        'Installer Code': installer.installerCode,
        'Full Name': installer.fullName,
        'CNIC': installer.cnic,
        'Phone Number': installer.phoneNumber,
        'WhatsApp Number': installer.whatsappNumber,
        'Address': installer.address,
        'City': installer.city,
        'Province': installer.province,
        'Training Center': installer.trainingCenter,
        'Company Name': installer.companyName,
        'Bank Name': installer.bankName,
        'Account Number': installer.accountNumber,
        'Account Title': installer.accountTitle,
        'Certified': installer.certified ? 'Yes' : 'No',
        'Referrer Code': installer.referrerCode || 'N/A',
        'Registered By': (installer.registeredBy as any)?.name || 'N/A',
        'Registration Date': new Date(installer.createdAt!).toLocaleDateString(),
      }));

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
