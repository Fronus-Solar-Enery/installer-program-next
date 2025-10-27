import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Installer from '@/models/Installer';
import { registerInstallerSchema } from '@/lib/validation';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { createGoogleContact } from '@/lib/googleContacts';
import { FilterQuery } from 'mongoose';
import { IInstaller } from '@/models/Installer';
import { ZodError } from 'zod';

// GET all installers with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const province = searchParams.get('province');
    const certified = searchParams.get('certified');
    const registeredBy = searchParams.get('registeredBy');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const query: FilterQuery<IInstaller> = {};

    if (search) {
      query.$or = [
        { installerCode: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (province) {
      query.province = { $regex: province, $options: 'i' };
    }

    if (certified !== null && certified !== undefined) {
      query.certified = certified === 'true';
    }

    if (registeredBy) {
      query.registeredBy = registeredBy;
    }

    const skip = (page - 1) * limit;

    const [installers, total] = await Promise.all([
      Installer.find(query)
        .populate('registeredBy', 'name email role')
        .populate('referrer', 'installerCode fullName')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Installer.countDocuments(query),
    ]);

    return ApiResponse.success({
      installers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Register new installer
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const body = await request.json();
    const validatedData = registerInstallerSchema.parse(body);

    await dbConnect();

    // Validate referrer code if provided
    if (validatedData.referrerCode) {
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

    // Create installer
    const installer = await Installer.create({
      ...validatedData,
      registeredBy: session.user.id,
    });

    // Create Google Contact (using global authentication)
    let googleContactStatus = 'not attempted';
    try {
      const googleContactId = await createGoogleContact({
        fullName: installer.fullName,
        phoneNumber: installer.phoneNumber,
        whatsappNumber: installer.whatsappNumber,
        address: installer.address,
        city: installer.city,
        province: installer.province,
        companyName: installer.companyName,
        installerCode: installer.installerCode,
        referrerCode: installer.referrerCode,
        cnic: installer.cnic,
        trainingCenter: installer.trainingCenter,
      });

      if (googleContactId) {
        installer.googleContactId = googleContactId;
        await installer.save();
        googleContactStatus = 'success';
        console.log('✓ Google contact created:', googleContactId);
      } else {
        googleContactStatus = 'failed - no ID returned';
        console.warn('⚠ Google contact creation returned null');
      }
    } catch (error) {
      googleContactStatus = 'failed - error';
      console.error('✗ Failed to create Google contact:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
    }

    const populatedInstaller = await Installer.findById(installer._id)
      .populate('registeredBy', 'name email role')
      .populate('referrer', 'installerCode fullName');

    return ApiResponse.success(populatedInstaller, 'Installer registered successfully', 201);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return ApiResponse.validationError(error.issues as Array<{ path?: PropertyKey[]; message: string }>);
    }
    return handleApiError(error);
  }
}
