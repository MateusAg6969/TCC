'use client';

// ============================================================================
// PÁGINA: MANUTENÇÃO (Maintenance Mode)
// ============================================================================
// O que faz: Exibida quando a plataforma está em modo de manutenção.
// Design: Estética premium, degradês roxo/oliva acadêmico e micro-animação.
// ============================================================================

import { Wrench, RefreshCw, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ManutencaoPage() {
  const router = useRouter();
  const [recarregando, setRecarregando] = useState(false);

  const tentarNovamente = () => {
    setRecarregando(true);
    // Tenta navegar para a home; se o modo de manutenção ainda estiver ativo,
    // o interceptor jogará o usuário de volta para esta página.
    setTimeout(() => {
      router.push('/home');
      setRecarregando(false);
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-if-bg flex flex-col items-center justify-center p-6 text-center text-if-text relative overflow-hidden select-none">
      {/* Elementos visuais em degradê de fundo */}
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-if-purple/10 rounded-full blur-[10rem] -z-10 animate-pulse duration-[8s]" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-if-olive/10 rounded-full blur-[10rem] -z-10 animate-pulse duration-[10s]" />

      <div className="max-w-md w-full bg-if-card border border-white/5 rounded-3xl p-8 sm:p-12 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logotipo Simplificado */}
        <div className="flex items-center justify-center gap-2 mb-8 text-if-text/40">
          <GraduationCap size={24} className="text-if-purple" />
          <span className="font-black text-sm tracking-[0.3em] uppercase">IF REDE</span>
        </div>

        {/* Ícone com Micro-Animações */}
        <div className="relative w-28 h-28 mx-auto mb-8 flex items-center justify-center">
          {/* Anel dinâmico piscando ao fundo */}
          <div className="absolute inset-0 bg-if-purple/5 border border-if-purple/20 rounded-full animate-ping duration-[3s]" />
          <div className="absolute inset-2 bg-if-olive/5 border border-if-olive/10 rounded-full animate-pulse duration-[2s]" />
          
          {/* Ícone principal */}
          <div className="relative w-20 h-20 bg-gradient-to-br from-if-purple to-if-olive rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-12 transition-transform duration-300">
            <Wrench size={40} className="text-white animate-bounce duration-[3s]" />
          </div>
        </div>

        {/* Mensagem principal */}
        <h1 className="text-3xl font-black mb-4 tracking-tight text-white">
          Estamos em <span className="text-if-olive">Manutenção</span>
        </h1>
        <p className="text-if-text/70 text-base leading-relaxed mb-10 font-medium">
          A plataforma está passando por melhorias rápidas e adição de novas funções acadêmicas. Voltaremos em instantes!
        </p>

        {/* Botão de Revalidação */}
        <button
          onClick={tentarNovamente}
          disabled={recarregando}
          className="w-full bg-if-purple text-white py-4 px-6 rounded-full font-bold shadow-lg shadow-if-purple/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-sm"
        >
          <RefreshCw size={18} className={recarregando ? 'animate-spin' : ''} />
          {recarregando ? 'Verificando status...' : 'Tentar acessar novamente'}
        </button>

        <p className="text-xs text-if-text/40 mt-6 font-bold tracking-widest uppercase">
          Agradecemos a compreensão
        </p>
      </div>
    </main>
  );
}
