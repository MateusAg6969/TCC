'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  Shield, 
  Users, 
  ShieldAlert, 
  Award, 
  FileText, 
  ArrowRight, 
  Loader2, 
  Home, 
  Activity 
} from 'lucide-react';
import api from '@/lib/api';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    usersCount: 0,
    pendingModerationCount: 0,
    wordsFilterCount: 0,
    badgesCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [manutencaoAtiva, setManutencaoAtiva] = useState(false);
  const [alternandoManutencao, setAlternandoManutencao] = useState(false);
  
  // Modal de Changelog ao desativar manutenção
  const [changelogModalOpen, setChangelogModalOpen] = useState(false);
  const [changelogText, setChangelogText] = useState('');

  // Redireciona usuários que não são admin nem moderadores
  useEffect(() => {
    if (!authLoading && (!user || (!user.admin && !user.mod_voluntario))) {
      router.push('/home');
    }
  }, [user, authLoading, router]);

  // Carregar dados das estatísticas do painel
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user || (!user.admin && !user.mod_voluntario)) return;
      
      try {
        setLoadingStats(true);
        let usersCount = 0;
        let pendingModerationCount = 0;
        let wordsFilterCount = 0;
        let badgesCount = 0;

        // 1. Total de usuários (Apenas Admin pode acessar)
        if (user.admin) {
          try {
            const usersRes = await api.get('/admin/users');
            usersCount = usersRes.data.meta?.total || usersRes.data.data?.length || 0;
          } catch (err) {
            console.error('Erro ao buscar total de usuários:', err);
          }
        }

        // 2. Moderação pendente (Admin e Mod podem acessar)
        try {
          const modRes = await api.get('/admin/moderation/pending');
          pendingModerationCount = modRes.data.data?.length || 0;
        } catch (err) {
          console.error('Erro ao buscar pendentes:', err);
        }

        // 3. Filtro de palavras (Admin e Mod podem acessar)
        try {
          const wordsRes = await api.get('/filtro-palavras');
          wordsFilterCount = wordsRes.data.meta?.total || wordsRes.data.data?.length || 0;
        } catch (err) {
          console.error('Erro ao buscar filtro de palavras:', err);
        }

        // 4. Medalhas do sistema (Acesso público/autenticado)
        try {
          const badgesRes = await api.get('/medalhas');
          badgesCount = badgesRes.data.data?.length || 0;
        } catch (err) {
          console.error('Erro ao buscar medalhas:', err);
        }

        setStats({
          usersCount,
          pendingModerationCount,
          wordsFilterCount,
          badgesCount
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas do dashboard:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (!authLoading) {
      fetchDashboardStats();
    }
  }, [user, authLoading]);

  // Buscar configuracao do Modo de Manutenção
  useEffect(() => {
    const buscarConfiguracoes = async () => {
      if (!user?.admin) return;
      try {
        const res = await api.get('/admin/configuracoes-sistema');
        setManutencaoAtiva(res.data.data?.modo_manutencao || false);
      } catch (err) {
        console.error('Erro ao buscar configuracoes do sistema:', err);
      }
    };
    buscarConfiguracoes();
  }, [user]);

  const alternarManutencao = async () => {
    if (alternandoManutencao) return;
    
    const novoStatus = !manutencaoAtiva;
    
    if (!novoStatus) {
      // Se estiver desativando a manutenção, abre o modal de changelog
      setChangelogModalOpen(true);
      return;
    }

    const confirmacao = window.confirm(
      'Tem certeza que deseja ATIVAR o Modo de Manutenção? Isso bloqueará o acesso de todos os estudantes na plataforma imediatamente!'
    );

    if (!confirmacao) return;
    executarAlternancia(novoStatus, '');
  };

  const executarAlternancia = async (novoStatus: boolean, changelog: string = '') => {
    setAlternandoManutencao(true);
    try {
      const payload: any = { modo_manutencao: novoStatus };
      if (!novoStatus && changelog.trim()) {
        payload.changelog = changelog;
      }
      const res = await api.patch('/admin/configuracoes-sistema', payload);
      setManutencaoAtiva(res.data.data?.modo_manutencao);
      if (novoStatus) {
        toast.success('Modo de manutenção ativado com sucesso! Plataforma restrita.');
      } else {
        toast.success('Modo de manutenção desativado! Plataforma liberada.');
        setChangelogModalOpen(false);
        setChangelogText('');
      }
    } catch (err) {
      console.error('Erro ao alternar modo de manutencao:', err);
      toast.error('Não foi possível alterar o status do modo de manutenção.');
    } finally {
      setAlternandoManutencao(false);
    }
  };

  if (authLoading || (!user || (!user.admin && !user.mod_voluntario))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-if-bg">
        <Loader2 className="animate-spin text-if-purple" size={48} />
      </div>
    );
  }

  // Definição dos módulos administrativos disponíveis
  const modules = [
    {
      title: 'Gestão de Usuários',
      description: 'Promover privilégios de moderação, aplicar ou suspender punições e excluir contas.',
      href: '/admin/users',
      icon: Users,
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/20 hover:border-purple-500/40',
      onlyAdmin: true,
      badgeText: 'Apenas Admin',
      statValue: stats.usersCount,
      statLabel: 'Usuários Cadastrados',
    },
    {
      title: 'Central de Moderação',
      description: 'Analisar e aprovar publicações retidas por denúncia ou bloqueios automáticos do filtro.',
      href: '/admin/moderation',
      icon: ShieldAlert,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/20 hover:border-amber-500/40',
      onlyAdmin: false,
      badgeText: 'Admin & Mod',
      statValue: stats.pendingModerationCount,
      statLabel: 'Postagens Pendentes',
    },
    {
      title: 'Filtro de Palavras',
      description: 'Gerenciar termos inadequados censurados ou retidos automaticamente nas postagens.',
      href: '/admin/words',
      icon: FileText,
      color: 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/20 hover:border-cyan-500/40',
      onlyAdmin: false,
      badgeText: 'Admin & Mod',
      statValue: stats.wordsFilterCount,
      statLabel: 'Palavras Bloqueadas',
    },
    {
      title: 'Gerenciador de Medalhas',
      description: 'Criar novas medalhas gamificadas e atribuir recompensas aos perfis dos usuários.',
      href: '/admin/badges',
      icon: Award,
      color: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40',
      onlyAdmin: false,
      badgeText: 'Admin & Mod',
      statValue: stats.badgesCount,
      statLabel: 'Medalhas Ativas',
    },
  ];

  return (
    <main className="min-h-screen bg-if-bg text-if-text p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header do Painel */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-if-card p-8 rounded-[40px] border border-white/5 shadow-2xl animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-3xl bg-if-purple/10 flex items-center justify-center text-if-purple border border-if-purple/20 shadow-inner">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">Painel do Administrador</h1>
              <p className="text-if-text/40 font-bold uppercase text-[10px] tracking-widest">Painel Administrativo Unificado</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {user.admin && (
              <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-5 py-2.5 rounded-2xl">
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-if-text/80 leading-none">Modo Manutenção</span>
                  <span className={`text-[9px] uppercase tracking-wider font-black mt-1.5 ${manutencaoAtiva ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {manutencaoAtiva ? 'Ativo (Restrito)' : 'Inativo (Aberto)'}
                  </span>
                </div>
                <button
                  onClick={alternarManutencao}
                  disabled={alternandoManutencao}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    manutencaoAtiva ? 'bg-rose-500 animate-pulse' : 'bg-white/20'
                  }`}
                  title={manutencaoAtiva ? 'Desativar Modo de Manutenção' : 'Ativar Modo de Manutenção'}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      manutencaoAtiva ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            <Link 
              href="/home"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all active:scale-95 text-sm"
            >
              <Home size={18} /> Ir para o Feed
            </Link>
          </div>
        </header>

        {/* Visão Geral Rápida (Stats Grid) */}
        <section className="mb-12 animate-in fade-in duration-600">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-if-purple animate-pulse" size={20} />
            <h2 className="text-lg font-bold tracking-tight text-if-text/80">Métricas Gerais da Rede</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-if-card border border-white/5 p-6 rounded-3xl flex flex-col justify-between shadow-xl">
              <span className="text-xs font-bold text-if-text/40 uppercase tracking-wider">Usuários</span>
              {loadingStats ? (
                <Loader2 className="animate-spin text-if-text/20 my-2" size={24} />
              ) : (
                <span className="text-3xl font-black text-white mt-2">{user.admin ? stats.usersCount : '---'}</span>
              )}
              <span className="text-[10px] text-if-text/30 font-medium">Cadastrados no IF REDE</span>
            </div>

            <div className="bg-if-card border border-white/5 p-6 rounded-3xl flex flex-col justify-between shadow-xl">
              <span className="text-xs font-bold text-if-text/40 uppercase tracking-wider">Moderação</span>
              {loadingStats ? (
                <Loader2 className="animate-spin text-if-text/20 my-2" size={24} />
              ) : (
                <span className={`text-3xl font-black mt-2 ${stats.pendingModerationCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {stats.pendingModerationCount}
                </span>
              )}
              <span className="text-[10px] text-if-text/30 font-medium">Postagens retidas na fila</span>
            </div>

            <div className="bg-if-card border border-white/5 p-6 rounded-3xl flex flex-col justify-between shadow-xl">
              <span className="text-xs font-bold text-if-text/40 uppercase tracking-wider">Filtro de Palavras</span>
              {loadingStats ? (
                <Loader2 className="animate-spin text-if-text/20 my-2" size={24} />
              ) : (
                <span className="text-3xl font-black text-white mt-2">{stats.wordsFilterCount}</span>
              )}
              <span className="text-[10px] text-if-text/30 font-medium">Termos inadequados cadastrados</span>
            </div>

            <div className="bg-if-card border border-white/5 p-6 rounded-3xl flex flex-col justify-between shadow-xl">
              <span className="text-xs font-bold text-if-text/40 uppercase tracking-wider">Medalhas</span>
              {loadingStats ? (
                <Loader2 className="animate-spin text-if-text/20 my-2" size={24} />
              ) : (
                <span className="text-3xl font-black text-white mt-2">{stats.badgesCount}</span>
              )}
              <span className="text-[10px] text-if-text/30 font-medium">Recompensas ativas criadas</span>
            </div>
          </div>
        </section>

        {/* Grade de Módulos (Cards de Ação) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {modules.map((m) => {
            // Se o módulo é apenas para Admin e o usuário logado não for Admin, não mostra
            if (m.onlyAdmin && !user.admin) return null;

            const Icon = m.icon;

            return (
              <div 
                key={m.title}
                className="group relative bg-if-card/60 hover:bg-if-card border border-white/5 rounded-[32px] p-8 shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center border shadow-inner`}>
                      <Icon size={24} />
                    </div>
                    <span className="text-[9px] uppercase tracking-widest font-black bg-white/5 text-if-text/40 px-2.5 py-1 rounded-full border border-white/5">
                      {m.badgeText}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white tracking-tight mb-2 group-hover:text-if-purple transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-sm text-if-text/60 leading-relaxed font-medium">
                    {m.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-if-text/40 uppercase tracking-wide">{m.statLabel}</span>
                    <span className="text-sm font-black text-white">
                      {loadingStats ? '...' : m.statValue}
                    </span>
                  </div>
                  
                  <Link 
                    href={m.href}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-if-purple hover:text-white text-xs font-bold transition-all group-hover:scale-105"
                  >
                    Gerenciar <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </section>
        {/* Modal de Changelog */}
        {changelogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-if-card border border-white/10 rounded-2xl p-6 max-w-lg w-full flex flex-col gap-4 animate-in zoom-in-95 duration-200 shadow-2xl">
              <h2 className="text-xl font-bold">Desativar Modo de Manutenção</h2>
              <p className="text-sm text-if-text/70">
                O site voltará ao ar. Deseja adicionar um <strong>Changelog</strong> para avisar os usuários sobre o que há de novo? (Deixe em branco se não houver novidades).
              </p>
              <textarea
                value={changelogText}
                onChange={(e) => setChangelogText(e.target.value)}
                placeholder="Ex: - Melhorias no desempenho&#10;- Correção de bugs visuais"
                className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-xl resize-none focus:outline-none focus:border-if-purple font-mono text-sm"
              />
              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => setChangelogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => executarAlternancia(false, changelogText)}
                  disabled={alternandoManutencao}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-if-purple hover:bg-if-purple/80 text-white transition-colors flex items-center gap-2"
                >
                  {alternandoManutencao && <Loader2 size={16} className="animate-spin" />}
                  Ligar Site
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
