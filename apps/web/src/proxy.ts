import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { URL } from 'url';
import { authClient } from './lib/auth-client';
type RouteRule = {
  path: string;
  type: 'protected' | 'public';
};
export async function proxy(request: NextRequest) {
  const routes: RouteRule[] = [
    { path: '/dashboard', type: 'protected' },
    { path: '/auth', type: 'public' },
  ];
  const authenticatedUser = false;
  const matchingRoute = routes.find(r => request.nextUrl.pathname.startsWith(r.path));   

  console.log(authenticatedUser);
  if (matchingRoute?.type === 'protected' && !authenticatedUser) {
    return NextResponse.redirect(
      new URL('/auth/signin', request.url)
    )
  }

  if (matchingRoute?.type === 'public' && authenticatedUser) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    )
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
