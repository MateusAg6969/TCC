'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Award, House, PlusSquare, Search, Users } from 'lucide-react';
import type { Post } from '@/types';
import ProfileTabs from './ProfileTabs';
import EditProfileModal from './EditProfileModal';

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
};

export default function ProfileClient({
  username,
  profile,
  posts,
}: {
  username: string;
  profile: ProfilePayload | null;
  posts: Post[];
}) {
  const [openModal, setOpenModal] = useState(false);

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
        {/*
          Navbar principal da tela de perfil.
          O que faz: replica o mesmo padrao de navegacao da Home (acao de criar post,
          campo de busca e botao de destino principal), mantendo consistencia visual
          entre as telas principais do produto.
          Por que foi feito assim: reduzir carga cognitiva e evitar que o usuario
          reaprenda navegacao ao trocar de contexto (Home -> Perfil).
          Fluxo de dados: o formulario envia o termo via query string para /search,
          o clique em Nova postagem navega para /post/new,
          e o clique em Pagina principal navega para /home.
        */}
        <header className="mb-6 flex flex-wrap items-center gap-3 rounded-main bg-if-card p-4 md:flex-nowrap md:px-6">
          <Link
            href="/post/new"
            className="inline-flex items-center gap-2 rounded-full bg-if-olive px-4 py-2 text-sm font-semibold text-if-bg"
          >
            <PlusSquare size={18} /> Nova postagem
          </Link>

          <form
            action="/search"
            method="get"
            className="flex flex-1 items-center gap-2 rounded-full bg-black/25 px-4 py-3"
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
            className="inline-flex items-center gap-2 rounded-full bg-if-olive px-4 py-2 text-sm font-semibold text-if-bg"
          >
            <House size={18} /> Pagina principal
          </Link>
        </header>

        <section className="mb-6 overflow-hidden rounded-main bg-if-card shadow-card">
          <div
            className="h-40 bg-cover bg-center"
            style={{
              backgroundImage: profile?.customizacao?.banner_url
                ? `url(${profile.customizacao.banner_url})`
                : 'linear-gradient(120deg, #442844, #2d1b2d)',
            }}
          />
          <div className="p-5">
            {/*
              Este bloco renderiza cabecalho visual do perfil (avatar + nome + acao de editar).
              O que faz: cria a composicao principal sobre o banner com margem negativa.
              Por que foi feito assim: o efeito de sobreposicao melhora a hierarquia visual do perfil,
              mas exige cuidado para nao cobrir elementos clicaveis fora desse contexto.
              Fluxo de dados: props profile -> campos exibidos no avatar/nome/bio -> acao local de abrir modal.
            */}
            <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-if-card bg-black/30 text-3xl font-black">
                  {(profile?.perfil?.nome || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{profile?.perfil?.nome || 'Perfil'}</h1>
                  <p className="max-w-xl text-sm text-if-text/70">{profile?.perfil?.bio || 'Sem bio por enquanto.'}</p>
                </div>
              </div>
              <button
                onClick={() => setOpenModal(true)}
                className="rounded-full px-5 py-2 text-sm font-semibold text-if-bg"
                style={{ background: 'var(--primary-color)' }}
              >
                Editar Perfil
              </button>
            </div>

          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <ProfileTabs posts={posts} />

          <aside className="space-y-4">
            <div className="rounded-main bg-if-card p-5">
              <h3 className="mb-3 text-lg font-semibold">Amigos em Comum</h3>
              <div className="space-y-2 text-sm text-if-text/80">
                <p className="flex items-center gap-2"><Users size={16} /> Lara M.</p>
                <p className="flex items-center gap-2"><Users size={16} /> Bruno A.</p>
                <p className="flex items-center gap-2"><Users size={16} /> Caio R.</p>
              </div>
            </div>

            <div className="rounded-main bg-if-card p-5">
              <h3 className="mb-3 text-lg font-semibold">Insígnias do perfil</h3>
              <ul className="space-y-2 text-sm text-if-text/85">
                <li className="flex items-center gap-2"><Award size={16} className="text-if-olive" /> {profile?.stats?.total_postagens || 0} posts publicados</li>
                <li className="flex items-center gap-2"><Award size={16} className="text-if-olive" /> {profile?.stats?.total_seguidores || 0} seguidores</li>
                <li className="flex items-center gap-2"><Award size={16} className="text-if-olive" /> 1+ ano de contribuição</li>
              </ul>
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
