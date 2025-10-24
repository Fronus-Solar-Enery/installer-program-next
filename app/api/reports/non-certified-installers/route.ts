import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import * as XLSX from 'xlsx';
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
      const workbook = XLSX.utils.book_new();

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

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      worksheet['!cols'] = [
        { wch: 15 }, // Installer Code
        { wch: 25 }, // Installer Name
        { wch: 50 }, // Address
        { wch: 25 }, // Phone/WhatsApp Number
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Non Certified Installers');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new Response(excelBuffer, {
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
