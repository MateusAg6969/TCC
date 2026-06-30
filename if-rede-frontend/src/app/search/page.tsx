import Link from 'next/link';
import { PlusSquare, UserCircle2 } from 'lucide-react';
import SearchClient from '@/components/SearchClient';
import { serverGet } from '@/lib/server-api';
import type { ApiSuccess } from '@/types';

type MePayload = {
  id: string;
};

async function getMe() {
  const response = await serverGet<ApiSuccess<MePayload>>('/usuarios/me');
  return response?.data || null;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  const params = await searchParams;
  const query = String(params?.q || '');
  const tipo = String(params?.tipo || 'todos');

  const me = await getMe();
  const profileHref = me?.id ? `/profile/${me.id}` : '/home';

  return (
    <main className="min-h-screen bg-if-bg text-if-text pb-24 md:pb-8">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <header className="mb-8 flex flex-wrap items-center gap-3 rounded-main bg-if-menu p-4 md:flex-nowrap md:px-6 shadow-card border border-white/5">
          <Link
            href="/post/new"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-if-olive px-6 py-2.5 text-sm font-black text-if-olive-contrast hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-if-olive/20"
          >
            <PlusSquare size={18} /> Nova postagem
          </Link>

          <div className="flex-1 text-center">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-if-text/20">Centro de Pesquisa IF REDE</span>
          </div>

          <Link
            href={profileHref}
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-if-olive px-6 py-2.5 text-sm font-black text-if-olive-contrast hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-if-olive/20"
          >
            <UserCircle2 size={18} /> Meu Perfil
          </Link>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-10">
            <h1 className="text-4xl md:text-6xl font-black text-if-purple tracking-tighter">O que você <br/> quer <span className="text-if-olive">descobrir</span> hoje?</h1>
            <p className="text-if-text/40 mt-4 max-w-lg font-medium text-lg italic border-l-4 border-if-olive/30 pl-6">
              Navegue pelo repositório acadêmico mais completo do IFC. Projetos, artes, áudios e conhecimento sem fronteiras.
            </p>
          </div>

          <SearchClient initialQuery={query} initialTipo={tipo} />
        </section>
      </div>
    </main>
  );
}
