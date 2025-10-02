import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import TeamMember, { TeamRole } from '@/models/TeamMember';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { authOptions } from '@/lib/auth';

// GET all team members (ADMIN/MANAGER only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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

    const query: any = {};

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
      teamMembers,
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
