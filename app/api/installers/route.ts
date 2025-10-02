import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Installer from '@/models/Installer';
import { registerInstallerSchema } from '@/lib/validation';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { authOptions } from '@/lib/auth';
import { createGoogleContact } from '@/lib/googleContacts';

// GET all installers with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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

    const query: any = {};

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
    const session = await getServerSession(authOptions);

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

    // Create Google Contact
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
        cnic: installer.cnic,
      });

      if (googleContactId) {
        installer.googleContactId = googleContactId;
        await installer.save();
      }
    } catch (error) {
      console.error('Failed to create Google contact:', error);
    }

    const populatedInstaller = await Installer.findById(installer._id)
      .populate('registeredBy', 'name email role')
      .populate('referrer', 'installerCode fullName');

    return ApiResponse.success(populatedInstaller, 'Installer registered successfully', 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return ApiResponse.validationError(error.errors);
    }
    return handleApiError(error);
  }
}
