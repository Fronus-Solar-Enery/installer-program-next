import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Installer from '@/models/Installer';
import InstallerReward from '@/models/InstallerReward';
import { updateInstallerSchema } from '@/lib/validation';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import mongoose from 'mongoose';
import { TeamRole } from '@/models/TeamMember';
import { updateGoogleContact, deleteGoogleContact } from '@/lib/googleContacts';
import { ZodError } from 'zod';

// GET single installer with stats
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const { id } = await params;
    const installer = await Installer.findById(id)
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
      { $match: { installer: new mongoose.Types.ObjectId(installer._id.toString()) } },
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
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const body = await request.json();
    const validatedData = updateInstallerSchema.parse(body);

    await dbConnect();

    const { id } = await params;
    const installer = await Installer.findById(id);

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
        await updateGoogleContact(session.user.id, installer.googleContactId, {
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
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return ApiResponse.validationError(error.issues);
    }
    return handleApiError(error);
  }
}

// DELETE installer (ADMIN/MANAGER only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    // Only ADMIN and MANAGER can delete
    if (session.user.role !== TeamRole.ADMIN && session.user.role !== TeamRole.MANAGER) {
      return ApiResponse.forbidden('Only admins and managers can delete installers');
    }

    await dbConnect();

    const { id } = await params;
    const installer = await Installer.findById(id);

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
        console.log(`Attempting to delete Google contact: ${installer.googleContactId} for installer: ${installer.installerCode}`);
        const deleted = await deleteGoogleContact(session.user.id, installer.googleContactId);
        if (deleted) {
          console.log(`Successfully deleted Google contact for installer: ${installer.installerCode}`);
        } else {
          console.warn(`Failed to delete Google contact for installer: ${installer.installerCode}`);
        }
      } catch (error) {
        console.error(`Error deleting Google contact for installer ${installer.installerCode}:`, error);
      }
    } else {
      console.log(`No Google contact ID found for installer: ${installer.installerCode}`);
    }

    await installer.deleteOne();

    return ApiResponse.success(null, 'Installer deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
