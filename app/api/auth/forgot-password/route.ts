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

    const user = await TeamMember.findOne({
      email: email.trim().toLowerCase(),
    });

    // Only issue/send a PIN for a real account — but the response below is
    // identical whether or not the account exists, so an attacker cannot
    // enumerate valid emails. Any failure here is logged, never surfaced (a
    // distinct error would re-leak the "account exists" signal).
    if (user) {
      try {
        const pin = generatePIN();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Replace any existing reset request for this email
        await PasswordReset.deleteMany({ email: user.email });
        await PasswordReset.create({ email: user.email, pin, expiresAt });

        // Extract device and location info from request
        const userAgent =
          request.headers.get('user-agent') || 'Unknown Device';
        const deviceInfo =
          userAgent.length > 100
            ? userAgent.substring(0, 100) + '...'
            : userAgent;

        const forwarded = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const ip = forwarded
          ? forwarded.split(',')[0]
          : realIp || 'Unknown IP';

        await sendPINEmail({
          email: user.email,
          pin,
          userName: user.name,
          deviceInfo,
          locationInfo: ip,
        });
      } catch (sendError) {
        console.error('Failed to issue/send reset PIN:', sendError);
      }
    }

    // Constant response regardless of account existence or delivery outcome.
    return NextResponse.json({
      success: true,
      message:
        'If an account exists for that email, a 6-digit PIN has been sent to it.',
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
