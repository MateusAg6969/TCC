/**
 * ============================================================================
 * PROXY E MIDDLEWARE DE AUTENTICAÇÃO E ROTEAMENTO (Next.js 16)
 * ============================================================================
 * O que faz: Intercepta as requisições HTTP no Next.js (Edge Runtime) para
 * controle de acesso baseado em cookies de autenticação (`ifrede_token`).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('ifrede_token')?.value;
  const { pathname } = request.nextUrl;

  // Define as rotas públicas que não exigem token de autenticação
  const publicRoutes = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/manutencao'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Redireciona para o login se tentar acessar rota protegida sem token
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se já possui token e tenta acessar rotas de autenticação, redireciona para a home
  if (token && isPublicRoute && pathname !== '/manutencao') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Se acessar a raiz ('/'), redireciona conforme existência do token
  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? '/home' : '/login', request.url));
  }

  return NextResponse.next();
}

// Suporte e retrocompatibilidade com convenções de middleware
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Aplica o middleware/proxy em todas as rotas EXCETO:
     * - Arquivos estáticos do Next.js (_next/static, _next/image)
     * - Arquivos da pasta public (favicon.ico)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
