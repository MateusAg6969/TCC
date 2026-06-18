'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, Lock, Bell, Palette, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// app/configuracoes/page.tsx
// O que faz: Página central de configurações do usuário.
// Por que: Fornecer um local unificado para gerenciamento de conta, preferências e logout.
// Fluxo: Verifica sessão -> renderiza placeholders -> permite logout seguro.

export default function ConfiguracoesPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Proteção de rota do lado do cliente
  // O que faz: Garante que apenas usuários autenticados acessem.
  useEffect(() => {
    if (!user && !isLoggingOut) {
      router.push('/login');
    }
  }, [user, router, isLoggingOut]);

  // Evita flash de conteúdo enquanto verifica a sessão
  if (!user) return null;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Erro durante o logout:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-if-bg text-if-text pb-24">
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        
        {/* Cabeçalho */}
        <header className="mb-8 flex items-center gap-4 rounded-main bg-if-card p-4 shadow-card border border-white/5">
          <Link 
            href="/home"
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Voltar para Home"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-if-purple">Configurações</h1>
            <p className="text-xs font-medium text-if-text/50 uppercase tracking-widest">
              Gerencie suas preferências
            </p>
          </div>
        </header>

        <div className="space-y-6">
          
          {/* Seção Perfil */}
          <section className="rounded-main bg-if-card p-6 shadow-card border border-white/5">
            <div className="flex items-center gap-3 mb-4 text-if-olive">
              <User size={20} />
              <h2 className="text-lg font-bold">Perfil</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-if-text/70 mb-1">Nome de Exibição</label>
                <input 
                  type="text" 
                  disabled
                  defaultValue={user?.nome}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-if-text/50 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-if-text/40">O nome está vinculado à base acadêmica.</p>
              </div>
            </div>
          </section>

          {/* Seção Privacidade */}
          <section className="rounded-main bg-if-card p-6 shadow-card border border-white/5">
            <div className="flex items-center gap-3 mb-4 text-if-olive">
              <Lock size={20} />
              <h2 className="text-lg font-bold">Privacidade</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-if-text/70 mb-1">Visibilidade do Perfil</label>
                <select 
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-if-purple/50 transition-colors"
                  defaultValue="publico"
                >
                  <option value="publico">Público (Todos podem ver)</option>
                  <option value="privado">Privado (Apenas seguidores)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Seção Notificações */}
          <section className="rounded-main bg-if-card p-6 shadow-card border border-white/5">
            <div className="flex items-center gap-3 mb-4 text-if-olive">
              <Bell size={20} />
              <h2 className="text-lg font-bold">Notificações</h2>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 cursor-pointer hover:border-if-purple/30 transition-colors">
                <div>
                  <span className="block text-sm font-bold">Notificações Push</span>
                  <span className="text-xs text-if-text/50">Receber alertas no navegador</span>
                </div>
                <input type="checkbox" className="w-4 h-4 accent-if-purple" defaultChecked />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 cursor-pointer hover:border-if-purple/30 transition-colors">
                <div>
                  <span className="block text-sm font-bold">E-mail Semanal</span>
                  <span className="text-xs text-if-text/50">Resumo de atividades da rede</span>
                </div>
                <input type="checkbox" className="w-4 h-4 accent-if-purple" />
              </label>
            </div>
          </section>

          {/* Seção Aparência */}
          <section className="rounded-main bg-if-card p-6 shadow-card border border-white/5">
            <div className="flex items-center gap-3 mb-4 text-if-olive">
              <Palette size={20} />
              <h2 className="text-lg font-bold">Aparência</h2>
            </div>
            <div className="flex gap-4">
              <button className="flex-1 py-3 px-4 rounded-xl border border-if-purple bg-if-purple/10 text-if-purple font-bold text-sm hover:bg-if-purple/20 transition-colors">
                Tema Escuro
              </button>
              <button className="flex-1 py-3 px-4 rounded-xl border border-white/10 bg-black/20 text-if-text/50 font-bold text-sm hover:bg-black/30 transition-colors cursor-not-allowed">
                Tema Claro (Em breve)
              </button>
            </div>
          </section>

        </div>

        {/* Botão de Logout */}
        <div className="mt-8">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/50 p-4 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={20} />
            {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
          </button>
        </div>

      </div>
    </main>
  );
}
