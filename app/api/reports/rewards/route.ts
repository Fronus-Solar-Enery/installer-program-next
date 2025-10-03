import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import * as XLSX from 'xlsx';
import dbConnect from '@/lib/mongodb';
import InstallerReward from '@/models/InstallerReward';
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
    const paymentStatus = searchParams.get('paymentStatus');
    const productModel = searchParams.get('productModel');
    const city = searchParams.get('city');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = {};

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    if (productModel) {
      query.productModel = { $regex: productModel, $options: 'i' };
    }

    if (city) {
      query.cityOfInstallation = { $regex: city, $options: 'i' };
    }

    if (startDate || endDate) {
      query.sendingDate = {};
      if (startDate) {
        query.sendingDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.sendingDate.$lte = new Date(endDate);
      }
    }

    const rewards = await InstallerReward.find(query)
      .populate('installer', 'installerCode fullName phoneNumber bankName accountNumber accountTitle')
      .populate('referrer', 'installerCode fullName phoneNumber bankName accountNumber accountTitle')
      .populate('registeredBy', 'name email')
      .sort({ createdAt: -1 });

    if (format === 'excel') {
      // Create Excel workbook
      const workbook = XLSX.utils.book_new();

      // Prepare data for Excel
      const excelData = rewards.map((reward) => {
        const installer = reward.installer as any;
        return {
          'Installer Code': reward.installerCode,
          'Installer Name': installer?.fullName || 'N/A',
          'Phone Number': installer?.phoneNumber || 'N/A',
          'Serial Number': reward.serialNumber,
          'Product Model': reward.productModel,
          'City of Installation': reward.cityOfInstallation,
          'Reward Amount': reward.rewardAmount,
          'Payment Status': reward.paymentStatus,
          'Transaction ID': reward.transactionId || 'N/A',
          'Bank Name': reward.bankName,
          'Account Number': reward.accountNumber,
          'Account Title': reward.accountTitle,
          'Payment Method': reward.paymentMethod || 'N/A',
          'Sending Date': reward.sendingDate ? new Date(reward.sendingDate).toLocaleDateString() : 'N/A',
          'Registered By': (reward.registeredBy as any)?.name || 'N/A',
          'Registration Date': new Date(reward.createdAt!).toLocaleDateString(),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rewards');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new Response(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=rewards_report_${Date.now()}.xlsx`,
        },
      });
    }

    // Calculate statistics
    const stats = await InstallerReward.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRewards: { $sum: 1 },
          totalAmount: { $sum: '$rewardAmount' },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'PENDING'] }, 1, 0] },
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] },
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'FAILED'] }, 1, 0] },
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'PENDING'] }, '$rewardAmount', 0] },
          },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$rewardAmount', 0] },
          },
          failedAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'FAILED'] }, '$rewardAmount', 0] },
          },
        },
      },
    ]);

    return ApiResponse.success({
      statistics: stats[0] || {},
      rewards,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
