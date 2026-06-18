'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Users, ArrowRight } from 'lucide-react';
import PostCard from '@/components/PostCard';
import PostSkeleton from '@/components/PostSkeleton';
import UserSkeleton from '@/components/UserSkeleton';
import api from '@/lib/api';
import type { Post } from '@/types';
import Link from 'next/link';
import SearchInput from './SearchInput';
import { toast } from 'sonner';

type SearchResults = {
  usuarios: any[];
  postagens: Post[];
};

/**
 * ============================================================================
 * COMPONENTE: SEARCH CLIENT (v3.0 - Componentização Total)
 * ============================================================================
 * O que faz: Gerencia resultados de busca de usuários e postagens.
 * Mudança: Agora utiliza o componente SearchInput compartilhado para o histórico.
 */

export default function SearchClient({ initialQuery, initialTipo }: { initialQuery: string; initialTipo: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [tipo, setTipo] = useState(initialTipo);
  const [resultados, setResultados] = useState<SearchResults>({ usuarios: [], postagens: [] });
  const [loading, setLoading] = useState(false);

  const buscar = useCallback(
    async (q: string, t: string) => {
      if (!q.trim()) {
        setResultados({ usuarios: [], postagens: [] });
        return;
      }
      setLoading(true);
      try {
        const endpoint = `/postagens/search?q=${encodeURIComponent(q)}&tipo=${t}&limit=50`;
        const res = await api.get(endpoint);
        const data = res.data.data;
        setResultados({
          usuarios: data.usuarios || [],
          postagens: data.postagens || []
        });
      } catch (err) {
        console.error('Erro na busca:', err);
        toast.error('Erro ao realizar busca. Verifique sua conexão.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      buscar(query, tipo);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, tipo, buscar]);

  const filtros = [
    { label: 'Todos', value: 'todos' },
    { label: 'Fotos', value: 'imagem' },
    { label: 'Textos', value: 'texto' },
    { label: 'Áudios/Msc', value: 'audio' },
    { label: 'Vídeos', value: 'video' },
  ];

  return (
    <section className="space-y-8">
      {/* SearchInput Reutilizável com Histórico Único */}
      <SearchInput 
        initialValue={query}
        onSearch={setQuery}
        loading={loading}
        autoFocus
        placeholder="Busque por posts, temas ou acadêmicos..."
        className="max-w-4xl"
      />

      {/* Filtros de Categoria */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-black uppercase tracking-widest text-if-text/40 mr-2 flex items-center gap-2">
          <Filter size={14} /> Filtrar por:
        </span>
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setTipo(f.value)}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
              tipo === f.value 
                ? 'bg-if-purple text-white shadow-lg shadow-if-purple/20' 
                : 'bg-if-card text-if-text/40 hover:bg-white/5 hover:text-if-text border border-white/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Seção de Usuários Encontrados */}
      {(loading || resultados.usuarios.length > 0) && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <h3 className="text-sm font-black uppercase tracking-widest text-if-olive mb-4 flex items-center gap-2">
            <Users size={16} /> Acadêmicos Encontrados
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <UserSkeleton key={i} />)
            ) : (
              resultados.usuarios.map((user) => (
                <Link
                  key={user._id}
                  href={`/profile/${user._id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-if-card border border-white/5 hover:border-if-purple/40 transition-all group shadow-sm"
                >
                  <div 
                    className="h-12 w-12 rounded-xl bg-if-purple/20 flex items-center justify-center font-black text-lg bg-cover bg-center border border-transparent group-hover:border-if-purple/30 transition-all"
                    style={user.customizacao?.avatar_url ? { backgroundImage: `url(${user.customizacao.avatar_url})` } : {}}
                  >
                    {!user.customizacao?.avatar_url && (user.perfil?.nome || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-if-text group-hover:text-if-purple transition-colors truncate">
                      {user.perfil?.nome}
                    </h4>
                    <p className="text-[10px] text-if-text/40 font-bold uppercase tracking-tighter">Ver perfil acadêmico</p>
                  </div>
                  <ArrowRight size={16} className="text-if-text/20 group-hover:text-if-purple group-hover:translate-x-1 transition-all" />
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Resultados de Postagens */}
      <div className="pt-4">
        {(loading || resultados.postagens.length > 0) ? (
          <>
            <h3 className="text-sm font-black uppercase tracking-widest text-if-purple mb-6 flex items-center gap-2">
              <Users size={16} /> Postagens Relacionadas
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 animate-in fade-in duration-500">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
              ) : (
                resultados.postagens.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))
              )}
            </div>
          </>
        ) : (
          !loading && query.trim() && resultados.usuarios.length === 0 && (
            <div className="rounded-3xl bg-if-card/30 p-20 text-center border-2 border-dashed border-white/5">
              <div className="mx-auto w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-if-text/10">
                <Users size={40} />
              </div>
              <h3 className="text-xl font-black text-if-text/60">Nenhum rastro encontrado</h3>
              <p className="text-if-text/40 mt-2 max-w-xs mx-auto font-medium">
                Sua busca não retornou resultados. Experimente termos mais genéricos ou mude a categoria.
              </p>
            </div>
          )
        )}
      </div>
    </section>
  );
}
