import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('ifrede_token')?.value;
  const { pathname } = request.nextUrl;

  // Define as rotas que não exigem login
  const publicRoutes = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Redireciona para o login se tentar acessar rota protegida sem token
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se já tem token e tentar acessar login/registro, redireciona para a home
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Se tentar acessar a raiz ('/') com token, vai para '/home' (se não tiver token já foi pego na primeira regra e vai pro login)
  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? '/home' : '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware em todas as rotas EXCETO:
     * - Arquivos estáticos do Next.js (_next/static, _next/image)
     * - Arquivos da pasta public (favicon.ico)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
