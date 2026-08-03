'use client';

// ============================================================================
// COMPONENTE: BOTTOM NAVIGATION BAR (Móvel Premium)
// ============================================================================
// O que faz: Barra de navegação inferior fixa para celulares (md:hidden).
// Design: Efeitos glassmorphism, micro-animações, indicador dinâmico (Framer Motion)
// e contador de notificações em tempo real.
// ============================================================================

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { House, Search, Plus, Bell, UserCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { naoLidas } = useNotifications();

  // Se o usuário não estiver autenticado, não renderiza a barra
  if (!user) return null;

  // Rotas onde a barra inferior NÃO deve aparecer (telas públicas ou de foco total)
  const rotasOcultas = [
    '/login',
    '/register',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
    '/manutencao'
  ];

  const deveOcultar = rotasOcultas.some(rota => pathname.startsWith(rota));
  if (deveOcultar) return null;

  const profileHref = `/profile/${user.id}`;

  const abas = [
    {
      nome: 'Início',
      href: '/home',
      icon: House,
    },
    {
      nome: 'Buscar',
      href: '/search',
      icon: Search,
    },
    {
      nome: 'Criar',
      href: '/post/new',
      icon: Plus,
      destacado: true,
    },
    {
      nome: 'Notificações',
      href: '/notificacoes',
      icon: Bell,
      badge: naoLidas,
    },
    {
      nome: 'Perfil',
      href: profileHref,
      icon: UserCircle2,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-if-menu/90 backdrop-blur-xl border-t border-white/5 shadow-[0_-8px_32px_rgba(0,0,0,0.4)] pb-safe">
      <div className="grid grid-cols-5 items-center h-16 w-full max-w-lg mx-auto px-1">
        {abas.map((aba) => {
          const Icon = aba.icon;
          const estaAtivo = pathname === aba.href || (aba.href !== '/home' && pathname.startsWith(aba.href));
          
          if (aba.destacado) {
            return (
              <div key={aba.nome} className="flex justify-center items-center h-full">
                <Link
                  href={aba.href}
                  className="relative -top-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-if-purple to-if-olive text-white shadow-lg shadow-if-purple/30 hover:brightness-110 active:scale-95 transition-all border-4 border-if-bg"
                  aria-label={aba.nome}
                >
                  <Icon size={26} strokeWidth={2.5} />
                </Link>
              </div>
            );
          }

          return (
            <div key={aba.nome} className="flex justify-center items-center h-full">
              <Link
                href={aba.href}
                className="relative flex flex-col items-center justify-center w-full h-full py-1 transition-all duration-300"
              >
                {/* Indicador Ativo com animação fluida (Spring Slider) */}
                {estaAtivo && (
                  <motion.div
                    layoutId="active-nav-glow"
                    className="absolute inset-x-1 inset-y-1 bg-if-purple/10 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Ícone e Elementos de Alerta */}
                <div className="relative flex items-center justify-center">
                  <Icon 
                    size={22} 
                    className={`transition-colors duration-300 ${estaAtivo ? 'text-if-olive' : 'text-if-text/50'}`} 
                  />
                  
                  {/* Badge de Notificações Não Lidas */}
                  {aba.badge !== undefined && aba.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white border border-if-bg animate-pulse">
                      {aba.badge > 99 ? '99+' : aba.badge}
                    </span>
                  )}
                </div>

                {/* Nome da Aba */}
                <span className={`text-[10px] mt-1 font-bold tracking-tight text-center truncate max-w-full px-0.5 transition-colors duration-300 ${estaAtivo ? 'text-if-olive' : 'text-if-text/40'}`}>
                  {aba.nome}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
