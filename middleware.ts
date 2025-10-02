import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { TeamRole } from '@/models/TeamMember';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Check if user is accessing admin/manager only routes
    if (path.startsWith('/api/team') && path !== '/api/team/profile') {
      if (token?.role !== TeamRole.ADMIN && token?.role !== TeamRole.MANAGER) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Only ADMIN can register ADMIN, MANAGER can register USER or MANAGER
      if (path === '/api/team/register' && req.method === 'POST') {
        // This will be handled in the API route
      }
    }

    // Installer delete - only ADMIN/MANAGER
    if (path.match(/\/api\/installers\/.*\/delete/) && req.method === 'DELETE') {
      if (token?.role !== TeamRole.ADMIN && token?.role !== TeamRole.MANAGER) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public paths
        if (
          path.startsWith('/auth/signin') ||
          path.startsWith('/auth/error') ||
          path.startsWith('/_next') ||
          path.startsWith('/api/auth')
        ) {
          return true;
        }

        // All other paths require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/installers/:path*', '/rewards/:path*', '/reports/:path*'],
};
