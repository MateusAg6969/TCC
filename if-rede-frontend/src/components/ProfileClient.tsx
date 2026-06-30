'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, House, Settings, PlusSquare, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { Post, PortfolioItem, Medalha } from '@/types';
import ProfileTabs from './ProfileTabs';
import EditProfileModal from './EditProfileModal';
import SocialSidePanel from './SocialSidePanel';
import BadgeGallery from './BadgeGallery';
import { useAuth } from '@/context/AuthContext';
import api, { resolveAssetUrl } from '@/lib/api';
import FormattedText from './FormattedText';

type ProfilePayload = {
  id: string;
  perfil: {
    nome: string;
    apelido?: string;
    bio?: string;
    privacidade?: string;
    url_personalizada?: string;
    status_vinculo?: string;
    curso?: string;
    ano?: string;
  };
  customizacao?: {
    cor_fundo?: string;
    cor_botoes?: string;
    avatar_url?: string;
    banner_url?: string;
    avatar_position?: string;
    banner_position?: string;
    medalhas?: Medalha[];
    portfolio?: PortfolioItem[];
    tema?: string;
    tema_valores_customizados?: Record<string, string>;
  };
  stats?: {
    total_seguidores?: number;
    total_seguindo?: number;
    total_postagens?: number;
  };
  seguindo?: boolean;
};

/**
 * ============================================================================
 * COMPONENTE: PROFILE CLIENT (v2.5)
 * ============================================================================
 * O que faz: Gerencia a visualização e interação do perfil de um usuário.
 * Justificativa: Centraliza a lógica de seguimento, edição e exibição de stats.
 */

export default function ProfileClient({
  username,
  profile: initialProfile,
  posts,
}: {
  username: string;
  profile: ProfilePayload | null;
  posts: Post[];
}) {
  const { user: currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [openModal, setOpenModal] = useState(false);
  const [carregandoSeguir, setCarregandoSeguir] = useState(false);
  const [activeSocialPanel, setActiveSocialPanel] = useState<'followers' | 'following' | null>(null);

  // Verificação de Identidade
  const ehProprioPerfil = useMemo(() => {
    return currentUser && profile && (String(currentUser.id) === String(profile.id) || String(currentUser.id) === String((profile as any)._id));
  }, [currentUser, profile]);

  const handleUpdateProfile = (newData: any) => {
    setProfile(prev => prev ? { ...prev, ...newData } : null);
  };

  // Ação Social: Seguir ou Deixar de Seguir.
  const alternarSeguir = async () => {
    if (!profile || carregandoSeguir) return;

    const estavaSeguindo = profile.seguindo;

    // Optimistic UI update
    setProfile(prev => prev ? {
      ...prev,
      seguindo: !estavaSeguindo,
      stats: { 
        ...prev.stats, 
        total_seguidores: estavaSeguindo 
          ? Math.max(0, (prev.stats?.total_seguidores || 1) - 1) 
          : (prev.stats?.total_seguidores || 0) + 1 
      }
    } : null);
    
    setCarregandoSeguir(true);

    try {
      if (estavaSeguindo) {
        await api.delete(`/usuarios/${profile.id}/seguir`);
      } else {
        await api.post(`/usuarios/${profile.id}/seguir`);
      }
    } catch (error) {
      console.error('Erro na ação social:', error);
      
      // Revert in case of failure
      setProfile(prev => prev ? {
        ...prev,
        seguindo: estavaSeguindo,
        stats: { 
          ...prev.stats, 
          total_seguidores: estavaSeguindo 
            ? (prev.stats?.total_seguidores || 0) + 1 
            : Math.max(0, (prev.stats?.total_seguidores || 1) - 1) 
        }
      } : null);

      if (estavaSeguindo) {
        toast.error('Não foi possível deixar de seguir. Tente novamente.');
      } else {
        toast.error('Erro ao seguir. Tente novamente mais tarde.');
      }
    } finally {
      setCarregandoSeguir(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const visitorTheme = localStorage.getItem('user-theme') || 'default';
    const visitorCustom = localStorage.getItem('user-theme-custom-values');

    // Apply Profile owner's theme
    const profileTheme = profile?.customizacao?.tema || 'default';
    const profileCustom = profile?.customizacao?.tema_valores_customizados || {};

    const html = document.documentElement;
    
    // Helper to calculate contrast
    const getContrastColor = (hex: string) => {
      if (!hex) return '#ffffff';
      const cleanHex = hex.replace('#', '');
      let r = 0, g = 0, b = 0;
      if (cleanHex.length === 3) {
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
      } else {
        r = parseInt(cleanHex.substring(0, 2), 16);
        g = parseInt(cleanHex.substring(2, 4), 16);
        b = parseInt(cleanHex.substring(4, 6), 16);
      }
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      return yiq >= 128 ? '#000000' : '#ffffff';
    };

    const applyTheme = (themeName: string, customVals: Record<string, string>) => {
      // Remove any existing theme class
      const classes = html.className.split(' ');
      const cleanClasses = classes.filter(c => !c.startsWith('theme-'));
      cleanClasses.push(`theme-${themeName}`);
      html.className = cleanClasses.join(' ').trim();

      if (themeName === 'custom') {
        Object.entries(customVals).forEach(([key, val]) => {
          html.style.setProperty(key, val);
        });
        html.style.setProperty('--brand-highlight-text', getContrastColor(customVals['--brand-highlight'] || '#ADCC5A'));
        html.style.setProperty('--brand-card-text', getContrastColor(customVals['--brand-title-background'] || '#2A172B'));
      } else {
        // Clear custom styles
        Object.keys(customVals).forEach((key) => {
          html.style.removeProperty(key);
        });
        html.style.removeProperty('--brand-highlight-text');
        html.style.removeProperty('--brand-card-text');
      }
    };

    applyTheme(profileTheme, profileCustom);

    // Revert to visitor theme when unmounting or when profile changes
    return () => {
      let parsedVisitorCustom = {};
      if (visitorCustom) {
        try {
          parsedVisitorCustom = JSON.parse(visitorCustom);
        } catch (e) {}
      }
      applyTheme(visitorTheme, parsedVisitorCustom);
    };
  }, [profile]);

  const styleVars = useMemo(() => {
    const primary = profile?.customizacao?.cor_botoes || '#8F9972';
    const bg = profile?.customizacao?.cor_fundo || '#2D1B2D';
    return {
      '--primary-color': primary,
      '--profile-bg': bg,
    } as React.CSSProperties;
  }, [profile]);

  return (
    <main className="min-h-screen bg-if-bg text-if-text pb-24 md:pb-8" style={styleVars}>
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        {/* Navbar */}
        <header className="mb-6 hidden md:flex flex-wrap items-center gap-3 rounded-main bg-if-menu p-4 md:flex-nowrap md:px-6">
          <Link
            href="/post/new"
            className="inline-flex items-center gap-2 rounded-full bg-if-olive px-4 py-2 text-sm font-semibold text-if-olive-contrast hover:brightness-110 transition-all"
          >
            <PlusSquare size={18} /> Nova postagem
          </Link>

          <form
            action="/search"
            method="get"
            className="flex flex-1 items-center gap-2 rounded-full bg-black/25 px-4 py-3 border border-white/5 focus-within:border-if-purple/30 transition-all"
          >
            <Search size={18} className="text-if-text/70" />
            <input
              name="q"
              className="w-full bg-transparent text-sm outline-none placeholder:text-if-text/50"
              placeholder="Busque projetos, poemas, artistas e orientadores..."
            />
          </form>

          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-full bg-if-olive/10 px-4 py-2 text-sm font-semibold text-if-olive hover:bg-if-olive hover:text-if-olive-contrast transition-all ml-auto md:ml-0"
          >
            <House size={18} /> Início
          </Link>

          {ehProprioPerfil && (
            <Link
              href="/configuracoes"
              className="inline-flex items-center gap-2 rounded-full bg-if-purple/10 px-4 py-2 text-sm font-semibold text-if-purple hover:bg-if-purple hover:text-white transition-all"
              title="Configurações"
            >
              <Settings size={18} /> Configurações
            </Link>
          )}
        </header>

        {/* Banner e Avatar */}
        <section className="mb-6 overflow-hidden rounded-main bg-if-card shadow-card">
          <div
            className="w-full aspect-[3.5/1] bg-cover transition-all bg-if-purple/20"
            style={{
              backgroundImage: profile?.customizacao?.banner_url
                ? `url(${resolveAssetUrl(profile.customizacao.banner_url)})`
                : 'linear-gradient(120deg, #442844, #2d1b2d)',
              backgroundPosition: profile?.customizacao?.banner_position ? `center ${profile.customizacao.banner_position}` : 'center',
            }}
          />
          <div className="p-6 sm:p-8 pb-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex flex-wrap items-end gap-6">
                <div className="relative group -mt-16 sm:-mt-20 z-10">
                  <div className="grid h-32 w-32 sm:h-40 sm:w-40 place-items-center rounded-3xl border-4 border-if-card bg-gradient-to-br from-if-purple to-if-olive overflow-hidden shadow-2xl bg-cover"
                       style={profile?.customizacao?.avatar_url ? { 
                         backgroundImage: `url(${resolveAssetUrl(profile.customizacao.avatar_url)})`,
                         backgroundPosition: profile?.customizacao?.avatar_position || 'center'
                       } : {}}>
                    {!profile?.customizacao?.avatar_url && (
                      <span className="text-5xl sm:text-6xl font-black text-white">
                        {(profile?.perfil?.nome || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{profile?.perfil?.nome || 'Perfil'}</h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {profile?.perfil?.apelido && (
                      <span className="text-if-purple text-sm font-black tracking-wide">
                        @{profile.perfil.apelido}
                      </span>
                    )}
                  </div>

                  {/* Badges Acadêmicos (Curso e Ano) */}
                  {(profile?.perfil?.status_vinculo || profile?.perfil?.curso || profile?.perfil?.ano) && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="bg-if-purple/10 text-if-purple border border-if-purple/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                        {profile?.perfil?.status_vinculo === 'egresso' ? 'Egresso (ex-aluno)' : 
                         profile?.perfil?.status_vinculo === 'servidor' ? 'Servidor / Professor' : 'Estudante'}
                      </span>
                      {profile?.perfil?.curso && (
                        <span className="bg-if-olive/15 text-if-olive border border-if-olive/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                          {profile.perfil.curso}
                        </span>
                      )}
                      {profile?.perfil?.ano && (
                        <span className="bg-white/5 text-if-text/70 border border-white/10 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                          {profile.perfil.ano === 'ex-aluno' ? 'Ex-aluno' : profile.perfil.ano}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="max-w-xl text-if-text/60 mt-3 font-medium italic">
                    {profile?.perfil?.bio ? (
                      <FormattedText text={profile.perfil.bio} />
                    ) : (
                      'Sem bio por enquanto.'
                    )}
                  </p>
                  
                  {/* Botões de Seguidores/Seguindo - Painel Lateral */}
                  <div className="mt-4 flex gap-6">
                    <button 
                      onClick={() => setActiveSocialPanel('followers')}
                      className="text-sm hover:text-if-purple transition-colors flex items-center gap-2 group"
                    >
                      <span className="font-black text-lg sm:text-xl group-hover:scale-110 transition-transform">{profile?.stats?.total_seguidores || 0}</span>
                      <span className="font-bold text-if-text/50">seguidores</span>
                    </button>
                    <button 
                      onClick={() => setActiveSocialPanel('following')}
                      className="text-sm hover:text-if-purple transition-colors flex items-center gap-2 group"
                    >
                      <span className="font-black text-lg sm:text-xl group-hover:scale-110 transition-transform">{profile?.stats?.total_seguindo || 0}</span>
                      <span className="font-bold text-if-text/50">seguindo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Ações Sociais */}
              <div className="mb-6 sm:mb-10">
                {ehProprioPerfil ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setOpenModal(true)}
                      className="rounded-2xl border-2 border-if-olive/20 bg-if-olive/10 px-6 py-3 text-sm font-bold text-if-olive shadow-xl hover:bg-if-olive hover:text-if-olive-contrast active:scale-95 transition-all"
                    >
                      Editar Perfil
                    </button>
                    <Link
                      href="/configuracoes"
                      className="rounded-2xl border-2 border-if-purple/20 bg-if-purple/10 px-6 py-3 text-sm font-bold text-if-purple shadow-xl hover:bg-if-purple hover:text-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Settings size={16} /> Configurações
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={alternarSeguir}
                    disabled={carregandoSeguir}
                    className={`rounded-2xl px-10 py-3.5 sm:px-12 sm:py-4 text-sm sm:text-base font-black shadow-xl transition-all active:scale-95 flex items-center gap-2 ${
                      profile?.seguindo 
                        ? 'bg-if-purple/10 text-if-purple border-2 border-if-purple/20 hover:bg-red-500 hover:text-white hover:border-red-500' 
                        : 'bg-if-purple/10 text-if-purple border-2 border-if-purple/20 hover:bg-if-purple hover:text-white'
                    } disabled:opacity-50`}
                  >
                    {carregandoSeguir ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : profile?.seguindo ? (
                      'Seguindo'
                    ) : (
                      'Seguir Acadêmico'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <ProfileTabs 
            posts={posts} 
            userId={profile?.id || ''} 
            isOwner={ehProprioPerfil || false}
            initialPortfolio={profile?.customizacao?.portfolio}
            onPostDelete={(postId) => {
              // The component needs local state to handle this properly,
              // but since we are modifying props, the quickest way to force a UI refresh 
              // for now without full state refactoring is simply reloading or handling it in ProfileTabs.
              // Actually, wait, it's better to reload if we don't have local state.
              window.location.reload();
            }}
          />

          <aside className="space-y-6">
            {/* Gamificação: Galeria de Selos */}
            <BadgeGallery medalhas={profile?.customizacao?.medalhas} />

            {/* Estatísticas Adicionais */}
            <div className="rounded-main bg-if-card p-6 border border-white/5 shadow-card">
              <h3 className="mb-4 text-xl font-black text-if-purple uppercase tracking-tighter">Atividade</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 font-bold text-if-text/80">
                  <div className="bg-if-olive/10 p-2 rounded-xl text-if-olive">
                    <Award size={20} />
                  </div>
                  {profile?.stats?.total_postagens || 0} posts publicados
                </li>
                <li className="flex items-center gap-3 font-bold text-if-text/80 cursor-pointer hover:text-if-purple transition-colors"
                    onClick={() => setActiveSocialPanel('followers')}>
                  <div className="bg-if-purple/10 p-2 rounded-xl text-if-purple">
                    <Users size={20} />
                  </div>
                  {profile?.stats?.total_seguidores || 0} seguidores
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </div>

      <EditProfileModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSave={handleUpdateProfile}
        defaultData={{
          nome: profile?.perfil?.nome || '',
          apelido: profile?.perfil?.apelido || '',
          bio: profile?.perfil?.bio || '',
          privacidade: profile?.perfil?.privacidade || 'publico',
          avatar_url: profile?.customizacao?.avatar_url || '',
          banner_url: profile?.customizacao?.banner_url || '',
          avatar_position: profile?.customizacao?.avatar_position || '50% 50%',
          banner_position: profile?.customizacao?.banner_position || '50%',
        }}
      />

      <SocialSidePanel 
        isOpen={!!activeSocialPanel}
        onClose={() => setActiveSocialPanel(null)}
        userId={profile?.id || ''}
        type={activeSocialPanel === 'following' ? 'following' : 'followers'}
        userName={profile?.perfil?.nome || ''}
      />
    </main>
  );
}
