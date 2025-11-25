import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';
import PasswordReset from '@/models/PasswordReset';
import bcrypt from 'bcryptjs';

// POST - Verify PIN and reset password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, pin, newPassword } = body;

    // Validate inputs
    if (!email || !pin || !newPassword) {
      return NextResponse.json(
        { error: 'Email, PIN, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the reset request
    const resetRequest = await PasswordReset.findOne({
      email: email.trim().toLowerCase(),
      pin: pin.trim(),
      used: false,
    });

    if (!resetRequest) {
      return NextResponse.json(
        { error: 'Invalid or expired PIN' },
        { status: 400 }
      );
    }

    // Check if PIN has expired
    if (new Date() > resetRequest.expiresAt) {
      // Clean up expired request
      await PasswordReset.deleteOne({ _id: resetRequest._id });
      return NextResponse.json(
        { error: 'PIN has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Find user
    const user = await TeamMember.findOne({ 
      email: email.trim().toLowerCase() 
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Mark PIN as used and delete it
    await PasswordReset.deleteOne({ _id: resetRequest._id });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
