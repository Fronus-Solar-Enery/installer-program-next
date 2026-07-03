import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import * as XLSX from 'xlsx';
import dbConnect from '@/lib/mongodb';
import InstallerReward, { IInstallerReward } from '@/models/InstallerReward';
import { IInstaller } from '@/models/Installer';
import { ITeamMember } from '@/models/TeamMember';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { escapeRegex } from '@/lib/queryBuilder';
import { FilterQuery } from 'mongoose';

// Type for populated reward document
interface PopulatedReward extends Omit<IInstallerReward, 'installer' | 'referrer' | 'registeredBy'> {
  installer: Pick<IInstaller, 'installerCode' | 'fullName' | 'phoneNumber' | 'bankName' | 'accountNumber' | 'accountTitle'>;
  referrer?: Pick<IInstaller, 'installerCode' | 'fullName' | 'phoneNumber' | 'bankName' | 'accountNumber' | 'accountTitle'>;
  registeredBy: Pick<ITeamMember, 'name' | 'email'>;
  createdAt: Date;
  sendingDate?: Date;
}

// Type for Excel export data
interface ExcelRewardData {
  'Installer Code': string;
  'Installer Name': string;
  'Phone Number': string;
  'Serial Number': string;
  'Product Model': string;
  'City of Installation': string;
  'Reward Amount': number;
  'Reward Status': string;
  'Transaction ID': string;
  'Bank Name': string;
  'Account Number': string;
  'Account Title': string;
  'Payment Method': string;
  'Sending Date': string;
  'Registered By': string;
  'Registration Date': string;
}

// Type for aggregation statistics
interface RewardStatistics {
  _id: null;
  totalRewards: number;
  totalAmount: number;
  pendingCount: number;
  paidCount: number;
  failedCount: number;
  pendingAmount: number;
  paidAmount: number;
  failedAmount: number;
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
    const rewardStatus = searchParams.get('rewardStatus');
    const productModel = searchParams.get('productModel');
    const city = searchParams.get('city');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: FilterQuery<IInstallerReward> = {};

    if (rewardStatus && rewardStatus !== 'all') {
      query.rewardStatus = rewardStatus;
    }

    if (productModel) {
      query.productModel = { $regex: escapeRegex(productModel), $options: 'i' };
    }

    if (city) {
      query.cityOfInstallation = { $regex: escapeRegex(city), $options: 'i' };
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
      const excelData: ExcelRewardData[] = rewards.map((reward) => {
        const populatedReward = reward as unknown as PopulatedReward;
        return {
          'Installer Code': populatedReward.installerCode,
          'Installer Name': populatedReward.installer?.fullName || 'N/A',
          'Phone Number': populatedReward.installer?.phoneNumber || 'N/A',
          'Serial Number': populatedReward.serialNumber,
          'Product Model': populatedReward.productModel,
          'City of Installation': populatedReward.cityOfInstallation,
          'Reward Amount': populatedReward.rewardAmount,
          'Reward Status': populatedReward.rewardStatus,
          'Transaction ID': populatedReward.transactionId || 'N/A',
          'Bank Name': populatedReward.bankName,
          'Account Number': populatedReward.accountNumber,
          'Account Title': populatedReward.accountTitle,
          'Payment Method': populatedReward.paymentMethod || 'N/A',
          'Sending Date': populatedReward.sendingDate ? new Date(populatedReward.sendingDate).toLocaleDateString() : 'N/A',
          'Registered By': populatedReward.registeredBy?.name || 'N/A',
          'Registration Date': new Date(populatedReward.createdAt).toLocaleDateString(),
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
    const stats = await InstallerReward.aggregate<RewardStatistics>([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRewards: { $sum: 1 },
          totalAmount: { $sum: '$rewardAmount' },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$rewardStatus', 'PENDING'] }, 1, 0] },
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$rewardStatus', 'PAID'] }, 1, 0] },
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$rewardStatus', 'FAILED'] }, 1, 0] },
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ['$rewardStatus', 'PENDING'] }, '$rewardAmount', 0] },
          },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$rewardStatus', 'PAID'] }, '$rewardAmount', 0] },
          },
          failedAmount: {
            $sum: { $cond: [{ $eq: ['$rewardStatus', 'FAILED'] }, '$rewardAmount', 0] },
          },
        },
      },
    ]);

    return ApiResponse.success({
      statistics: stats[0] || {
        _id: null,
        totalRewards: 0,
        totalAmount: 0,
        pendingCount: 0,
        paidCount: 0,
        failedCount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        failedAmount: 0,
      },
      rewards,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
