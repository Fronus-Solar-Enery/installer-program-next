import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Installer from '@/models/Installer';
import InstallerReward from '@/models/InstallerReward';
import { updateInstallerSchema } from '@/lib/validation';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { authOptions } from '@/lib/auth';
import { TeamRole } from '@/models/TeamMember';
import { updateGoogleContact, deleteGoogleContact } from '@/lib/googleContacts';

// GET single installer with stats
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const installer = await Installer.findById(params.id)
      .populate('registeredBy', 'name email role')
      .populate('referrer', 'installerCode fullName');

    if (!installer) {
      return ApiResponse.notFound('Installer not found');
    }

    // Get reward statistics
    const [totalRewards, pendingRewards, paidRewards, failedRewards] = await Promise.all([
      InstallerReward.countDocuments({ installer: installer._id }),
      InstallerReward.countDocuments({ installer: installer._id, paymentStatus: 'PENDING' }),
      InstallerReward.countDocuments({ installer: installer._id, paymentStatus: 'PAID' }),
      InstallerReward.countDocuments({ installer: installer._id, paymentStatus: 'FAILED' }),
    ]);

    // Get reward amounts
    const rewardAmounts = await InstallerReward.aggregate([
      { $match: { installer: installer._id } },
      {
        $group: {
          _id: '$paymentStatus',
          total: { $sum: '$rewardAmount' },
        },
      },
    ]);

    const amountByStatus = {
      all: 0,
      PENDING: 0,
      PAID: 0,
      FAILED: 0,
    };

    rewardAmounts.forEach((item) => {
      amountByStatus[item._id as keyof typeof amountByStatus] = item.total;
      amountByStatus.all += item.total;
    });

    return ApiResponse.success({
      installer,
      statistics: {
        totalRewards,
        pendingRewards,
        paidRewards,
        failedRewards,
        totalAmount: amountByStatus.all,
        pendingAmount: amountByStatus.PENDING,
        paidAmount: amountByStatus.PAID,
        failedAmount: amountByStatus.FAILED,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT - Update installer
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const body = await request.json();
    const validatedData = updateInstallerSchema.parse(body);

    await dbConnect();

    const installer = await Installer.findById(params.id);

    if (!installer) {
      return ApiResponse.notFound('Installer not found');
    }

    // Validate referrer code if being updated
    if (validatedData.referrerCode && validatedData.referrerCode !== installer.referrerCode) {
      const referrer = await Installer.findOne({ installerCode: validatedData.referrerCode });
      if (!referrer) {
        return ApiResponse.error('Invalid referrer code', 400);
      }

      // Check if referrer has already referred 5 installers
      const referralCount = await Installer.countDocuments({ referrer: referrer._id });
      if (referralCount >= 5) {
        return ApiResponse.error('Referrer has already referred maximum (5) installers', 400);
      }
    }

    // Update installer
    Object.assign(installer, validatedData);
    await installer.save();

    // Update Google Contact
    if (installer.googleContactId) {
      try {
        await updateGoogleContact(installer.googleContactId, {
          fullName: installer.fullName,
          phoneNumber: installer.phoneNumber,
          whatsappNumber: installer.whatsappNumber,
          address: installer.address,
          city: installer.city,
          province: installer.province,
          companyName: installer.companyName,
          installerCode: installer.installerCode,
          cnic: installer.cnic,
        });
      } catch (error) {
        console.error('Failed to update Google contact:', error);
      }
    }

    const updatedInstaller = await Installer.findById(installer._id)
      .populate('registeredBy', 'name email role')
      .populate('referrer', 'installerCode fullName');

    return ApiResponse.success(updatedInstaller, 'Installer updated successfully');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return ApiResponse.validationError(error.errors);
    }
    return handleApiError(error);
  }
}

// DELETE installer (ADMIN/MANAGER only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return ApiResponse.unauthorized();
    }

    // Only ADMIN and MANAGER can delete
    if (session.user.role !== TeamRole.ADMIN && session.user.role !== TeamRole.MANAGER) {
      return ApiResponse.forbidden('Only admins and managers can delete installers');
    }

    await dbConnect();

    const installer = await Installer.findById(params.id);

    if (!installer) {
      return ApiResponse.notFound('Installer not found');
    }

    // Check if installer has any rewards
    const rewardCount = await InstallerReward.countDocuments({ installer: installer._id });
    if (rewardCount > 0) {
      return ApiResponse.error(
        'Cannot delete installer with existing rewards. Please delete rewards first.',
        400
      );
    }

    // Delete Google Contact
    if (installer.googleContactId) {
      try {
        await deleteGoogleContact(installer.googleContactId);
      } catch (error) {
        console.error('Failed to delete Google contact:', error);
      }
    }

    await installer.deleteOne();

    return ApiResponse.success(null, 'Installer deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
