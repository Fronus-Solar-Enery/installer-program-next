import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';
import PasswordReset from '@/models/PasswordReset';
import { generatePIN, sendPINEmail } from '@/lib/email';

// POST - Request password reset (send PIN)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user exists
    const user = await TeamMember.findOne({ 
      email: email.trim().toLowerCase() 
    });

    // Check if user exists and return error if not
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address. Please check your email or contact support.' },
        { status: 404 }
      );
    }

    // Generate 6-digit PIN
    const pin = generatePIN();
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing reset requests for this email
    await PasswordReset.deleteMany({ email: user.email });

    // Save new PIN to database
    await PasswordReset.create({
      email: user.email,
      pin,
      expiresAt,
    });

    // Extract device and location info from request
    const userAgent = request.headers.get('user-agent') || 'Unknown Device';
    const deviceInfo = userAgent.length > 100 ? userAgent.substring(0, 100) + '...' : userAgent;
    
    // Get IP address from various possible headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0] : (realIp || 'Unknown IP');
    const locationInfo = ip;

    // Send PIN via email
    try {
      await sendPINEmail({
        email: user.email,
        pin,
        userName: user.name,
        deviceInfo,
        locationInfo,
      });
    } catch (emailError) {
      console.error('Failed to send PIN email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email. Please check email configuration.' },
        { status: 500 }
      );
    }

    // Return success with confirmation message
    return NextResponse.json({
      success: true,
      message: 'A 6-digit PIN has been sent to your email address.',
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
