// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET 
  });

  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/', '/login', '/api/auth', '/api/health'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Si no hay token y está tratando de acceder a una ruta protegida
  if (!token && !isPublicPath) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Si hay token, verificar el estado del usuario
  if (token) {
    const isPending = !token.role || !token.hasCompanies;
    const isDashboard = pathname.startsWith('/dashboard');
    const isPendingPage = pathname === '/pending-approval';

    // Si el usuario está pendiente y no está en la página de pending-approval
    if (isPending && isDashboard && !isPendingPage) {
      return NextResponse.redirect(new URL('/pending-approval', request.url));
    }

    // Si el usuario NO está pendiente pero está tratando de acceder a pending-approval
    if (!isPending && isPendingPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require auth
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/make).*)',
  ],
};
