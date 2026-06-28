'use client';

import Link from 'next/link';
import { House, Settings, PlusSquare, Sparkles, UserCircle2, Shield, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PostCard from '@/components/PostCard';
import NotificationBell from '@/components/NotificationBell';
import SearchInput from '@/components/SearchInput';
import type { Post } from '@/types';

type HomeFeedClientProps = {
  feed: Post[];
  destaques: Post[];
  profileHref: string;
};

import React, { useState } from 'react';

export default function HomeFeedClient({ feed, destaques, profileHref }: HomeFeedClientProps) {
  const { logout, user } = useAuth();
  const [filtro, setFiltro] = useState<string>('Todos');

  // A Home sempre exibe o feed inicial; a busca agora redireciona para /search.
  const postsFiltrados = filtro === 'Todos' ? feed : feed.filter(p => p.subtipo === filtro);
  const principais = postsFiltrados.slice(0, 8);
  const artistas = postsFiltrados.slice(8, 12);
  const highlights = destaques;

  const subtiposUnicos = Array.from(new Set(feed.map(p => p.subtipo).filter(Boolean))) as string[];

  const semResultados = postsFiltrados.length === 0;

  return (
    <main className="min-h-screen bg-if-bg text-if-text">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <header className="mb-6 flex flex-wrap items-center gap-3 rounded-main bg-if-card p-4 md:flex-nowrap md:px-6">
          {/*
            Bloco de acao rapida para criar postagem.
            O que faz: expoe um CTA de alta prioridade visual no topo da Home.
            Por que assim: replica o comportamento de redes sociais (Instagram/Twitter),
            onde o caminho de criacao precisa estar sempre acessivel sem rolagem.
            Fluxo de dados: clique do usuario -> navegacao para /post/new -> formulario envia para API.
          */}
          <Link
            href="/post/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-if-olive px-3 md:px-4 py-2 text-sm font-semibold text-if-bg hover:brightness-110 transition-all shrink-0"
            title="Nova postagem"
          >
            <PlusSquare size={18} /> <span className="hidden sm:inline">Nova postagem</span>
          </Link>

          <div className="flex-1 min-w-[200px] w-full md:w-auto order-last md:order-none mt-2 md:mt-0">
            <SearchInput 
              className="w-full"
              placeholder="Projetos, poemas, artistas..."
            />
          </div>
          
          <NotificationBell />
          
          <Link
            href="/home"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-if-olive/10 px-3 md:px-4 py-2 text-sm font-semibold text-if-olive hover:bg-if-olive hover:text-if-bg transition-all ml-auto md:ml-0 shrink-0"
            title="Início"
          >
            <House size={18} /> <span className="hidden lg:inline">Início</span>
          </Link>

          <Link
            href={profileHref}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-if-olive px-3 md:px-4 py-2 text-sm font-semibold text-if-bg hover:brightness-110 transition-all shrink-0"
            title="Meu Perfil"
          >
            <UserCircle2 size={18} /> <span className="hidden lg:inline">Meu Perfil</span>
          </Link>

          <Link
            href="/configuracoes"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-if-purple/10 px-3 md:px-4 py-2 text-sm font-semibold text-if-purple hover:bg-if-purple hover:text-white transition-all shrink-0"
            title="Configurações"
          >
            <Settings size={18} /> <span className="hidden lg:inline">Configurações</span>
          </Link>
          
          {user?.admin && (
            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500/10 px-3 md:px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500 hover:text-white transition-all shrink-0"
              title="Painel Admin"
            >
              <Shield size={18} /> <span className="hidden lg:inline">Admin</span>
            </Link>
          )}

          {(user?.admin || user?.mod_voluntario) && (
             <Link
              href="/admin/moderation"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-500/10 px-3 md:px-4 py-2 text-sm font-semibold text-blue-500 hover:bg-blue-500 hover:text-white transition-all shrink-0"
              title="Painel Moderação"
            >
              <ShieldAlert size={18} /> <span className="hidden lg:inline">Moderação</span>
            </Link>
          )}
        </header>

        {subtiposUnicos.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
            <button
              onClick={() => setFiltro('Todos')}
              className={`snap-start whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                filtro === 'Todos'
                  ? 'bg-if-purple text-white shadow-lg shadow-if-purple/20'
                  : 'bg-if-card text-if-text/60 border border-white/5 hover:bg-if-purple/20 hover:text-if-purple'
              }`}
            >
              Todos
            </button>
            {subtiposUnicos.map((sub) => (
              <button
                key={sub}
                onClick={() => setFiltro(sub)}
                className={`snap-start whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  filtro === sub
                    ? 'bg-if-purple text-white shadow-lg shadow-if-purple/20'
                    : 'bg-if-card text-if-text/60 border border-white/5 hover:bg-if-purple/20 hover:text-if-purple'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        <section className="mb-6 rounded-main bg-gradient-to-r from-if-card via-if-card to-if-olive/25 p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-if-olive">
            <Sparkles size={16} />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Destaques da semana</h2>
          </div>
          {highlights.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-3 custom-scrollbar">
              {highlights.map((post) => (
                <Link 
                  key={post._id} 
                  href={`/post/${post._id}`}
                  className="min-w-[240px] rounded-2xl bg-black/20 p-4 border border-white/5 hover:bg-black/30 hover:border-if-olive/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-if-olive bg-if-olive/10 px-2 py-0.5 rounded">
                      {post.tipo}
                    </span>
                    <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                      ❤️ {post.stats?.likes || 0}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-sm font-black group-hover:text-if-olive transition-colors">{post.titulo}</p>
                  <p className="mt-1 text-[10px] text-if-text/50 font-medium">Postagem Popular da Semana</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-if-text/70 italic">Nada em destaque no momento.</p>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <h3 className="mb-4 text-xl font-semibold">O que achamos que você vai gostar</h3>
            <div className="grid gap-4 md:grid-cols-2 items-start">
              {principais.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
              {semResultados && (
                <div className="rounded-main bg-if-card p-6 text-if-text/70">Nao ha resultados.</div>
              )}
            </div>
          </div>

          <aside>
            <h3 className="mb-4 text-xl font-semibold">Artistas da semana</h3>
            <div className="space-y-4">
              {artistas.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
              {semResultados && (
                <div className="rounded-main bg-if-card p-6 text-if-text/70">Nao ha resultados.</div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
