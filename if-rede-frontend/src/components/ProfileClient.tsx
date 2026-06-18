'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
<<<<<<< HEAD
import { Award, House, LogOut, PlusSquare, Search, Users } from 'lucide-react';
=======
import { Award, House, PlusSquare, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
>>>>>>> 1195be29257b4796f80e437d5d0e43c86fa384f5
import type { Post } from '@/types';
import ProfileTabs from './ProfileTabs';
import EditProfileModal from './EditProfileModal';
import SocialSidePanel from './SocialSidePanel';
import BadgeGallery from './BadgeGallery';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

type ProfilePayload = {
  id: string;
  perfil: {
    nome: string;
    bio?: string;
    privacidade?: string;
  };
  customizacao?: {
    cor_fundo?: string;
    cor_botoes?: string;
    avatar_url?: string;
    banner_url?: string;
    medalhas?: string[];
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

    setCarregandoSeguir(true);
    try {
      if (profile.seguindo) {
        await api.delete(`/usuarios/${profile.id}/seguir`);
        setProfile(prev => prev ? {
          ...prev,
          seguindo: false,
          stats: { ...prev.stats, total_seguidores: Math.max(0, (prev.stats?.total_seguidores || 1) - 1) }
        } : null);
      } else {
        await api.post(`/usuarios/${profile.id}/seguir`);
        setProfile(prev => prev ? {
          ...prev,
          seguindo: true,
          stats: { ...prev.stats, total_seguidores: (prev.stats?.total_seguidores || 0) + 1 }
        } : null);
      }
    } catch (error) {
      console.error('Erro na ação social:', error);
      
      // Mostrar toast amigável ao usuário
      if (profile.seguindo) {
        toast.error('Não foi possível deixar de seguir. Tente novamente.');
      } else {
        toast.error('Erro ao seguir. Tente novamente mais tarde.');
      }
    } finally {
      setCarregandoSeguir(false);
    }
  };

  const styleVars = useMemo(() => {
    const primary = profile?.customizacao?.cor_botoes || '#8F9972';
    const bg = profile?.customizacao?.cor_fundo || '#2D1B2D';
    return {
      '--primary-color': primary,
      '--profile-bg': bg,
    } as React.CSSProperties;
  }, [profile]);

  return (
    <main className="min-h-screen bg-if-bg text-if-text pb-20" style={styleVars}>
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        {/* Navbar */}
        <header className="mb-6 flex flex-wrap items-center gap-3 rounded-main bg-if-card p-4 md:flex-nowrap md:px-6">
          <Link
            href="/post/new"
            className="inline-flex items-center gap-2 rounded-full bg-if-olive px-4 py-2 text-sm font-semibold text-if-bg hover:brightness-110 transition-all"
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
            className="inline-flex items-center gap-2 rounded-full bg-if-olive px-4 py-2 text-sm font-semibold text-if-bg hover:brightness-110 transition-all"
          >
            <House size={18} /> Página principal
          </Link>

          {ehProprioPerfil && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/50 text-red-500 bg-red-500/10 px-4 py-2 text-sm font-semibold hover:bg-red-500 hover:text-white transition-all ml-auto md:ml-0"
              title="Sair da conta"
            >
              <LogOut size={18} /> Sair
            </button>
          )}
        </header>

        {/* Banner e Avatar */}
        <section className="mb-6 overflow-hidden rounded-main bg-if-card shadow-card">
          <div
            className="h-48 bg-cover bg-center transition-all bg-if-purple/20"
            style={{
              backgroundImage: profile?.customizacao?.banner_url
                ? `url(${profile.customizacao.banner_url})`
                : 'linear-gradient(120deg, #442844, #2d1b2d)',
            }}
          />
          <div className="p-6">
            <div className="-mt-16 flex flex-wrap items-end justify-between gap-6">
              <div className="flex items-end gap-6">
                <div className="relative group">
                  <div className="grid h-32 w-32 place-items-center rounded-3xl border-4 border-if-card bg-gradient-to-br from-if-purple to-if-olive overflow-hidden shadow-2xl bg-cover bg-center"
                       style={profile?.customizacao?.avatar_url ? { backgroundImage: `url(${profile.customizacao.avatar_url})` } : {}}>
                    {!profile?.customizacao?.avatar_url && (
                      <span className="text-5xl font-black text-white">
                        {(profile?.perfil?.nome || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="pb-2">
                  <h1 className="text-3xl font-black tracking-tight">{profile?.perfil?.nome || 'Perfil'}</h1>
                  <p className="max-w-xl text-if-text/60 mt-1 font-medium italic">
                    {profile?.perfil?.bio || 'Sem bio por enquanto.'}
                  </p>
                  
                  {/* Botões de Seguidores/Seguindo - Painel Lateral */}
                  <div className="mt-4 flex gap-4">
                    <button 
                      onClick={() => setActiveSocialPanel('followers')}
                      className="text-sm hover:text-if-purple transition-colors flex items-center gap-2 group"
                    >
                      <span className="font-black text-lg group-hover:scale-110 transition-transform">{profile?.stats?.total_seguidores || 0}</span>
                      <span className="font-bold text-if-text/50">seguidores</span>
                    </button>
                    <button 
                      onClick={() => setActiveSocialPanel('following')}
                      className="text-sm hover:text-if-purple transition-colors flex items-center gap-2 group"
                    >
                      <span className="font-black text-lg group-hover:scale-110 transition-transform">{profile?.stats?.total_seguindo || 0}</span>
                      <span className="font-bold text-if-text/50">seguindo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Ações Sociais */}
              <div className="pb-2">
                {ehProprioPerfil ? (
                  <button
                    onClick={() => setOpenModal(true)}
                    className="rounded-2xl px-8 py-3 text-sm font-bold text-if-bg shadow-xl hover:scale-105 active:scale-95 transition-all"
                    style={{ background: 'var(--primary-color)' }}
                  >
                    Editar Perfil
                  </button>
                ) : (
                  <button
                    onClick={alternarSeguir}
                    disabled={carregandoSeguir}
                    className={`rounded-2xl px-10 py-3 text-sm font-black shadow-xl transition-all active:scale-95 flex items-center gap-2 ${
                      profile?.seguindo 
                        ? 'bg-if-purple/10 text-if-purple border-2 border-if-purple/20' 
                        : 'bg-if-purple text-white'
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

        {/* Conteúdo Principal */}
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <ProfileTabs 
            posts={posts} 
            userId={profile?.id || ''} 
            isOwner={ehProprioPerfil || false}
            initialPortfolio={profile?.customizacao?.portfolio}
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
          bio: profile?.perfil?.bio || '',
          privacidade: profile?.perfil?.privacidade || 'publico',
          avatar_url: profile?.customizacao?.avatar_url || '',
          banner_url: profile?.customizacao?.banner_url || '',
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
