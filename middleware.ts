import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    // If accessing protected routes without token, redirect to login
    if (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/clients')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  const role = token.role as string;
  
  // Admin only routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (role !== 'ADMIN') {
      const clientId = token.clientId as string;
      if (clientId) {
        return NextResponse.redirect(new URL(`/clients/${clientId}`, req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Client workspace routes
  if (req.nextUrl.pathname.startsWith('/clients/')) {
    if (role === 'CLIENT') {
      const clientId = token.clientId as string;
      const pathClientId = req.nextUrl.pathname.split('/')[2]; // /clients/[id]
      
      // Clients can only access their own workspace
      if (clientId !== pathClientId) {
        return NextResponse.redirect(new URL(`/clients/${clientId}`, req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/clients/:path*'],
};
