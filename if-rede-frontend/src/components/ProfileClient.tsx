'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Award, House, PlusSquare, Search, Users } from 'lucide-react';
import type { Post } from '@/types';
import ProfileTabs from './ProfileTabs';
import EditProfileModal from './EditProfileModal';
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
    banner_url?: string;
    medalhas?: string[];
  };
  stats?: {
    total_seguidores?: number;
    total_postagens?: number;
  };
  seguindo?: boolean;
};

/**
 * ============================================================================
 * COMPONENTE: PROFILE CLIENT (v2.3)
 * ============================================================================
 * O que faz: Gerencia a visualização e interação do perfil de um usuário.
 * Justificativa: Centraliza a lógica de seguimento, edição e exibição de stats.
 * Fluxo de Dados: Props (profile, posts) -> State local para interações sociais.
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
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [openModal, setOpenModal] = useState(false);
  const [carregandoSeguir, setCarregandoSeguir] = useState(false);

  // Verificação de Identidade: O perfil visualizado é do próprio usuário logado?
  const ehProprioPerfil = useMemo(() => {
    return currentUser && profile && (String(currentUser.id) === String(profile.id) || String(currentUser.id) === String((profile as any)._id));
  }, [currentUser, profile]);

  // Ação Social: Seguir ou Deixar de Seguir.
  const alternarSeguir = async () => {
    if (!profile || carregandoSeguir) return;

    setCarregandoSeguir(true);
    try {
      if (profile.seguindo) {
        // Fluxo: DELETE -> Atualiza estado local (Optimistic UI)
        await api.delete(`/usuarios/${profile.id}/seguir`);
        setProfile(prev => prev ? {
          ...prev,
          seguindo: false,
          stats: { ...prev.stats, total_seguidores: Math.max(0, (prev.stats?.total_seguidores || 1) - 1) }
        } : null);
      } else {
        // Fluxo: POST -> Atualiza estado local + Dispara Notificação no Backend
        await api.post(`/usuarios/${profile.id}/seguir`);
        setProfile(prev => prev ? {
          ...prev,
          seguindo: true,
          stats: { ...prev.stats, total_seguidores: (prev.stats?.total_seguidores || 0) + 1 }
        } : null);
      }
    } catch (error) {
      console.error('Erro na ação social:', error);
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
    <main className="min-h-screen bg-if-bg text-if-text" style={styleVars}>
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
            <House size={18} /> Pagina principal
          </Link>
        </header>

        {/* Banner e Avatar */}
        <section className="mb-6 overflow-hidden rounded-main bg-if-card shadow-card">
          <div
            className="h-48 bg-cover bg-center transition-all"
            style={{
              backgroundImage: profile?.customizacao?.banner_url
                ? `url(${profile.customizacao.banner_url})`
                : 'linear-gradient(120deg, #442844, #2d1b2d)',
            }}
          />
          <div className="p-6">
            <div className="-mt-16 flex flex-wrap items-end justify-between gap-6">
              <div className="flex items-end gap-6">
                <div className="grid h-28 w-28 place-items-center rounded-3xl border-4 border-if-card bg-gradient-to-br from-if-purple to-if-olive text-4xl font-black text-white shadow-2xl">
                  {(profile?.perfil?.nome || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="pb-2">
                  <h1 className="text-3xl font-black tracking-tight">{profile?.perfil?.nome || 'Perfil'}</h1>
                  <p className="max-w-xl text-if-text/60 mt-1 font-medium italic">
                    {profile?.perfil?.bio || 'Sem bio por enquanto.'}
                  </p>
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
          <ProfileTabs posts={posts} />

          <aside className="space-y-6">
            {/* Estatísticas */}
            <div className="rounded-main bg-if-card p-6 border border-white/5 shadow-card">
              <h3 className="mb-4 text-xl font-black text-if-purple">Insignias e Stats</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 font-bold text-if-text/80">
                  <div className="bg-if-olive/10 p-2 rounded-xl text-if-olive">
                    <Award size={20} />
                  </div>
                  {profile?.stats?.total_postagens || 0} posts publicados
                </li>
                <li className="flex items-center gap-3 font-bold text-if-text/80">
                  <div className="bg-if-purple/10 p-2 rounded-xl text-if-purple">
                    <Users size={20} />
                  </div>
                  {profile?.stats?.total_seguidores || 0} seguidores
                </li>
              </ul>
            </div>

            {/* Sugestões ou Amigos (Simulado) */}
            <div className="rounded-main bg-if-card p-6 border border-white/5 shadow-card">
              <h3 className="mb-4 text-lg font-bold">Conexões recentes</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-if-olive/20 flex items-center justify-center font-bold">L</div>
                  <span className="font-bold text-sm">Lara Mendes</span>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-if-purple/20 flex items-center justify-center font-bold">B</div>
                  <span className="font-bold text-sm">Bruno Almeida</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>

      <EditProfileModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        defaultName={profile?.perfil?.nome || ''}
        defaultUsername={username}
      />
    </main>
  );
}
