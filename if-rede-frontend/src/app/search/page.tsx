import Link from 'next/link';
import { PlusSquare, Search, UserCircle2 } from 'lucide-react';
import PostCard from '@/components/PostCard';
import { serverGet } from '@/lib/server-api';
import type { ApiSuccess, Post } from '@/types';

type MePayload = {
  id: string;
};

async function getFeed() {
  const response = await serverGet<ApiSuccess<Post[]>>('/postagens/feed?page=1&limit=50');
  return response?.data || [];
}

async function getMe() {
  const response = await serverGet<ApiSuccess<MePayload>>('/usuarios/me');
  return response?.data || null;
}

function filtrarPosts(feed: Post[], query: string) {
  const term = query.trim().toLowerCase();

  if (!term) {
    return [];
  }

  return feed.filter((post) => {
    const autor = post.autor_id?.perfil?.nome || '';
    const searchable = [
      post.titulo,
      post.descricao || '',
      post.subtipo || '',
      post.tipo,
      post.conteudo?.texto_longo || '',
      autor,
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(term);
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = String(params?.q || '');

  const [feed, me] = await Promise.all([getFeed(), getMe()]);
  const resultados = filtrarPosts(feed, query);
  const profileHref = me?.id ? `/profile/${me.id}` : '/home';

  return (
    <main className="min-h-screen bg-if-bg text-if-text">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <header className="mb-6 flex flex-wrap items-center gap-3 rounded-main bg-if-card p-4 md:flex-nowrap md:px-6">
          {/*
            O botao de nova postagem tambem aparece na tela de busca.
            O que faz: mantem o mesmo atalho de criacao presente na Home.
            Por que assim: consistencia de navegacao reduz friccao entre telas.
            Fluxo de dados: clique -> /post/new -> submissao do formulario -> retorno para Home.
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
              defaultValue={query}
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

        <section className="rounded-main bg-if-card p-6">
          <h1 className="text-xl font-semibold">Resultados da busca</h1>
          <p className="mt-1 text-sm text-if-text/70">
            {query.trim() ? `Termo pesquisado: ${query}` : 'Digite um termo para pesquisar no feed.'}
          </p>

          {resultados.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {resultados.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-main bg-black/20 p-6 text-if-text/70">Nao ha resultados.</div>
          )}
        </section>
      </div>
    </main>
  );
}
