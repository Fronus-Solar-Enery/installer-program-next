import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import TeamMember, { TeamRole, ITeamMember } from '@/models/TeamMember';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import bcrypt from 'bcryptjs';
import { FilterQuery } from 'mongoose';


// GET all team members (ADMIN/MANAGER only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const userRole = session.user.role;

    if (userRole !== TeamRole.ADMIN && userRole !== TeamRole.MANAGER) {
      return ApiResponse.forbidden('Only admins and managers can view team members');
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const query: FilterQuery<ITeamMember> = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    }

    const skip = (page - 1) * limit;

    const [teamMembers, total] = await Promise.all([
      TeamMember.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      TeamMember.countDocuments(query),
    ]);

    return ApiResponse.success({
      members: teamMembers,
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

// POST - Create new team member (ADMIN/MANAGER only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const userRole = session.user.role;

    // Only ADMIN and MANAGER can create team members
    if (userRole !== TeamRole.ADMIN && userRole !== TeamRole.MANAGER) {
      return ApiResponse.forbidden('Only admins and managers can create team members');
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return ApiResponse.validationError([
        { field: 'required', message: 'Name, email, password, and role are required' },
      ]);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ApiResponse.validationError([{ field: 'email', message: 'Invalid email format' }]);
    }

    // Validate password length
    if (password.length < 6) {
      return ApiResponse.validationError([
        { field: 'password', message: 'Password must be at least 6 characters' },
      ]);
    }

    // Check role permissions
    // MANAGER cannot create ADMIN
    if (userRole === TeamRole.MANAGER && role === TeamRole.ADMIN) {
      return ApiResponse.forbidden('Managers cannot create admin accounts');
    }

    await dbConnect();

    // Check if email already exists
    const existingUser = await TeamMember.findOne({ email });
    if (existingUser) {
      return ApiResponse.error('Email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new team member
    const newTeamMember = await TeamMember.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Return without password
    const { password: _, ...teamMemberWithoutPassword } = newTeamMember.toObject();

    return ApiResponse.success(teamMemberWithoutPassword, 'Team member created successfully');
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return ApiResponse.error('Email already exists', 400);
    }
    return handleApiError(error);
  }
}
