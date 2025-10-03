import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import GoogleAuth from '@/models/GoogleAuth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const googleAuth = await GoogleAuth.findOne({
      userId: session.user.id,
      isActive: true,
    });

    return NextResponse.json({
      isAuthenticated: !!googleAuth,
      hasRefreshToken: !!googleAuth?.refreshToken,
    });
  } catch (error) {
    console.error('Error checking Google auth status:', error);
    return NextResponse.json(
      { error: 'Failed to check authentication status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    await GoogleAuth.findOneAndUpdate(
      { userId: session.user.id },
      { isActive: false }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking Google auth:', error);
    return NextResponse.json(
      { error: 'Failed to revoke authentication' },
      { status: 500 }
    );
  }
}
