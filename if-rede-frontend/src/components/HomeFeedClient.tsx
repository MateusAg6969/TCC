'use client';

import Link from 'next/link';
import { PlusSquare, Search, Sparkles, UserCircle2 } from 'lucide-react';
import PostCard from '@/components/PostCard';
import WordFilterManager from '@/components/WordFilterManager';
import type { Post } from '@/types';

type HomeFeedClientProps = {
  feed: Post[];
  profileHref: string;
};

export default function HomeFeedClient({ feed, profileHref }: HomeFeedClientProps) {
  // A Home sempre exibe o feed inicial; a busca agora redireciona para /search.
  const principais = feed.slice(0, 8);
  const artistas = feed.slice(8, 12);
  const highlights = feed.length
    ? feed.slice(0, 5).map((post) => post.titulo)
    : [];

  const semResultados = feed.length === 0;

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
            className="inline-flex items-center gap-2 rounded-full bg-if-olive px-4 py-2 text-sm font-semibold text-if-bg"
          >
            <PlusSquare size={18} /> Nova postagem
          </Link>

          <form action="/search" method="get" className="flex flex-1 items-center gap-2 rounded-full bg-black/25 px-4 py-3">
            <Search size={18} className="text-if-text/70" />
            <input
              name="q"
              className="w-full bg-transparent text-sm outline-none placeholder:text-if-text/50"
              placeholder="Busque projetos, poemas, artistas e orientadores..."
            />
          </form>
          <Link
            href={profileHref}
            className="inline-flex items-center gap-2 rounded-full bg-if-olive px-4 py-2 text-sm font-semibold text-if-bg"
          >
            <UserCircle2 size={18} /> Meu Perfil
          </Link>
        </header>

        <section className="mb-6 rounded-main bg-gradient-to-r from-if-card via-if-card to-if-olive/25 p-5">
          <div className="mb-3 flex items-center gap-2 text-if-olive">
            <Sparkles size={16} />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Destaques da semana</h2>
          </div>
          {highlights.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {highlights.map((titulo, index) => (
                <div key={`highlight-${index}`} className="min-w-[220px] rounded-2xl bg-black/20 p-3">
                  <p className="line-clamp-1 text-sm font-semibold">{titulo}</p>
                  <p className="mt-1 text-xs text-if-text/70">Curadoria academica do IF REDE</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-if-text/70">Nao ha resultados.</p>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <h3 className="mb-4 text-xl font-semibold">O que achamos que voce vai gostar</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {principais.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
              {semResultados && (
                <div className="rounded-main bg-if-card p-6 text-if-text/70">Nao ha resultados.</div>
              )}
            </div>
          </div>

          <aside>
            <div className="mb-4">
              <WordFilterManager />
            </div>
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
