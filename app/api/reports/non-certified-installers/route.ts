import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import ExcelJS from 'exceljs';
import dbConnect from '@/lib/mongodb';
import Installer, { IInstaller } from '@/models/Installer';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';

// Type for Excel export data
interface ExcelNonCertifiedData {
  'Installer Code': string;
  'Installer Name': string;
  'Address': string;
  'Phone/WhatsApp Number': string;
}

// Helper function to format phone numbers
function formatPhoneNumbers(phone: string, whatsapp: string): string {
  // Remove any spaces and format consistently
  const formatNumber = (num: string) => {
    // Remove all non-digit characters except '+'
    let digits = num.replace(/[^\d+]/g, '');

    // Handle +92 country code (Pakistan)
    if (digits.startsWith('+92')) {
      // Remove +92 and add 0 prefix
      digits = '0' + digits.slice(3);
    } else if (digits.startsWith('92') && digits.length === 12) {
      // Handle 92XXXXXXXXXX format (without +)
      digits = '0' + digits.slice(2);
    }

    // Remove all non-digit characters now
    digits = digits.replace(/\D/g, '');

    // Format as 0XXX-XXXXXXX (4 digits - 7 digits)
    if (digits.length === 11 && digits.startsWith('0')) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }

    // Return original if format doesn't match
    return num;
  };

  const formattedPhone = formatNumber(phone);
  const formattedWhatsapp = formatNumber(whatsapp);

  // If numbers are the same, show only once
  if (formattedPhone === formattedWhatsapp) {
    return formattedPhone;
  }

  // If both exist but different, show both
  return `${formattedPhone}, ${formattedWhatsapp}`;
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

    // Query for non-certified installers only
    const installers = await Installer.find({ certified: false })
      .select('installerCode fullName address city province phoneNumber whatsappNumber')
      .sort({ createdAt: -1 })
      .lean<IInstaller[]>();

    if (format === 'excel') {
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Non Certified Installers');

      // Prepare data for Excel
      const excelData: ExcelNonCertifiedData[] = installers.map((installer) => {
        // Combine address, city, and province
        const fullAddress = `${installer.address}, ${installer.city}, ${installer.province}`;

        // Format phone numbers
        const phoneNumbers = formatPhoneNumbers(
          installer.phoneNumber,
          installer.whatsappNumber
        );

        return {
          'Installer Code': installer.installerCode,
          'Installer Name': installer.fullName,
          'Address': fullAddress,
          'Phone/WhatsApp Number': phoneNumbers,
        };
      });

      // Set columns and widths for better readability
      worksheet.columns = [
        { header: 'Installer Code', key: 'Installer Code', width: 15 },
        { header: 'Installer Name', key: 'Installer Name', width: 25 },
        { header: 'Address', key: 'Address', width: 50 },
        { header: 'Phone/WhatsApp Number', key: 'Phone/WhatsApp Number', width: 25 },
      ];
      worksheet.addRows(excelData);

      // Generate Excel file
      const excelBuffer = await workbook.xlsx.writeBuffer();

      return new Response(Buffer.from(excelBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=non_certified_installers_${Date.now()}.xlsx`,
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
