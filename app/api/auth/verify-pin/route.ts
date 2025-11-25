import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PasswordReset from '@/models/PasswordReset';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, pin } = body;

    // Validate input
    if (!email || !pin) {
      return NextResponse.json(
        { error: 'Email and PIN are required' },
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
        { error: 'Invalid PIN. Please check and try again.' },
        { status: 400 }
      );
    }

    // Check if PIN has expired
    if (new Date() > resetRequest.expiresAt) {
      // Delete expired PIN
      await PasswordReset.deleteOne({ _id: resetRequest._id });
      return NextResponse.json(
        { error: 'PIN has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // PIN is valid
    return NextResponse.json({
      success: true,
      message: 'PIN verified successfully',
    });

  } catch (error) {
    console.error('Error verifying PIN:', error);
    return NextResponse.json(
      { error: 'An error occurred while verifying PIN' },
      { status: 500 }
    );
  }
}
