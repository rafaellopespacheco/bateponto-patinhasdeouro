import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  const isProtectedPath = path.startsWith('/dashboard') || path.startsWith('/admin');
  const isAdminPath = path.startsWith('/admin');

  // Skip middleware se não for rota protegida
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get('session')?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  // Verifica permissão de admin
  if (isAdminPath && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
