import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStaticOrApi = 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.svg';

  if (isStaticOrApi) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session')?.value;
  const payload = sessionCookie ? await verifyJWT(sessionCookie) : null;

  // Public routes that do not require authentication
  const isPublicRoute = pathname === '/login' || pathname === '/solicitar';

  // Redirect unauthenticated users to login
  if (!isPublicRoute && !payload) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from login
  if (pathname === '/login' && payload) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check admin permission for /usuarios route
  if (pathname.startsWith('/usuarios') && payload?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check admin permission for /maestros route
  if (pathname.startsWith('/maestros') && payload?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};
