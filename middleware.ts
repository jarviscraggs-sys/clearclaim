import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function verifyAdminSession(cookieValue: string): boolean {
  const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
  const [token, hmac] = cookieValue.split('.');
  if (!token || !hmac) return false;
  const expected = crypto.createHmac('sha256', secret).update(token).digest('hex');
  if (hmac.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin/* routes (but not /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession || !verifyAdminSession(adminSession.value)) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
