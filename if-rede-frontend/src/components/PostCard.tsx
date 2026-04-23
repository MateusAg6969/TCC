'use client';

import Image from 'next/image';
import { Heart, MessageCircle, Repeat2 } from 'lucide-react';
import type { Post } from '@/types';

function resolveAssetUrl(url?: string) {
  // O que faz: converte caminhos relativos do backend em URL absoluta para o frontend.
  // Por que: arquivos enviados sao servidos por http://localhost:3000/uploads...
  // e o navegador da app Next (porta 3000/3001) precisa do host correto para carregar.
  // Fluxo: entrada url do post -> verifica se ja e absoluta -> prefixa NEXT_PUBLIC_API_URL quando relativo.
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

function textPreview(text?: string) {
  if (!text) return '';
  if (text.length < 180) return text;
  return `${text.slice(0, 180)}...`;
}

export default function PostCard({ post }: { post: Post }) {
  const tipo = post.tipo;
  const arquivoUrl = resolveAssetUrl(post.conteudo?.url);

  return (
    <article className="rounded-main bg-if-card p-4 text-if-text shadow-card">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold">{post.titulo}</h3>
          <p className="text-xs text-if-text/70">{post.autor_id?.perfil?.nome || 'Autor desconhecido'}</p>
        </div>
        <span className="rounded-full bg-black/20 px-3 py-1 text-xs uppercase tracking-wide">{tipo}</span>
      </header>

      {tipo === 'texto' && (
        <div className="rounded-2xl bg-black/15 p-4">
          <p className="leading-relaxed text-if-text/90">{textPreview(post.conteudo?.texto_longo)}</p>
        </div>
      )}

      {tipo === 'imagem' && arquivoUrl && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image src={arquivoUrl} alt={post.titulo} fill className="object-cover" unoptimized />
        </div>
      )}

      {(tipo === 'audio' || tipo === 'msc') && (
        <div className="rounded-2xl bg-black/20 p-4">
          <p className="text-sm font-medium text-if-olive">{post.subtipo || 'Faixa acadêmica'}</p>
          <p className="mb-3 text-xs text-if-text/70">{arquivoUrl ? 'Streaming pronto' : 'Sem URL de áudio'}</p>
          <audio className="h-9 w-full accent-if-olive" controls src={arquivoUrl}>
            Seu navegador não suporta áudio.
          </audio>
        </div>
      )}

      {tipo === 'texto' && !post.conteudo?.texto_longo && arquivoUrl && (
        <a
          href={arquivoUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex rounded-full border border-if-olive px-3 py-1 text-xs text-if-olive"
        >
          Abrir arquivo de texto
        </a>
      )}

      <footer className="mt-4 flex items-center gap-5 text-if-text/80">
        <button className="flex items-center gap-2 text-sm transition hover:text-white">
          <Heart size={16} /> {post.stats?.likes || 0}
        </button>
        <button className="flex items-center gap-2 text-sm transition hover:text-white">
          <MessageCircle size={16} /> {post.stats?.comentarios_count || 0}
        </button>
        <button className="flex items-center gap-2 text-sm transition hover:text-white">
          <Repeat2 size={16} /> {post.stats?.shares || 0}
        </button>
      </footer>
    </article>
  );
}
