import { NextResponse, type NextRequest } from 'next/server';
import { refreshSession } from '@/lib/supabase-api';

const protectedPaths = ['/forum', '/onboarding', '/settings', '/mod'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresAuth = protectedPaths.some((path) => pathname.startsWith(path));

  const accessToken = request.cookies.get('ts_access_token')?.value;
  const refreshToken = request.cookies.get('ts_refresh_token')?.value;

  if (!requiresAuth) {
    return NextResponse.next();
  }

  if (accessToken) {
    return NextResponse.next();
  }

  if (refreshToken) {
    const refreshed = await refreshSession(refreshToken).catch(() => null);
    if (refreshed) {
      const response = NextResponse.next();
      response.cookies.set('ts_access_token', refreshed.access_token, { httpOnly: true, sameSite: 'lax', path: '/', secure: true });
      response.cookies.set('ts_refresh_token', refreshed.refresh_token, { httpOnly: true, sameSite: 'lax', path: '/', secure: true });
      return response;
    }
  }

  const loginUrl = new URL('/auth', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/forum/:path*', '/onboarding/:path*', '/settings/:path*', '/mod/:path*']
};
