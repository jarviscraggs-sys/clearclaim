import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function verifyAdminSession(cookieValue: string): boolean {
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
    const lastDot = cookieValue.lastIndexOf('.');
    if (lastDot === -1) return false;
    const token = cookieValue.substring(0, lastDot);
    const hmac = cookieValue.substring(lastDot + 1);
    if (!token || !hmac) return false;
    const expected = crypto.createHmac('sha256', secret).update(token).digest('hex');
    if (expected.length !== hmac.length) return false;
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
  } catch {
    return false;
  }
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
