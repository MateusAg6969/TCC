import { NextRequest, NextResponse } from 'next/server';

const protectedPaths = ['/home', '/profile', '/search', '/post'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('ifrede_token')?.value;

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/profile/:path*', '/search/:path*', '/post/:path*', '/login', '/register'],
};
