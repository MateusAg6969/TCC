'use client';

import { PortfolioItem } from '@/types';
import { resolveAssetUrl } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Tag, ExternalLink, PinOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PortfolioCardProps {
  post: PortfolioItem;
  isOwner: boolean;
  onUnpin?: (postId: string) => void;
}

/**
 * ============================================================================
 * COMPONENTE: PORTFOLIO CARD (v1.0 - Destaque Gigante)
 * ============================================================================
 * O que faz: Exibe postagens fixadas no portfólio com layout de alta evidência.
 * Estilo: Cards maiores, imagens expandidas e tipografia refinada.
 */
export default function PortfolioCard({ post, isOwner, onUnpin }: PortfolioCardProps) {
  const isImage = post.tipo === 'imagem';
  
  return (
    <div className="group relative overflow-hidden rounded-[32px] bg-if-card border border-white/5 shadow-2xl transition-all hover:border-if-purple/30 hover:shadow-if-purple/10">
      
      {/* Botão de Desafixar (Apenas Dono) */}
      {isOwner && onUnpin && (
        <button
          onClick={() => onUnpin(post._id)}
          className="absolute right-4 top-4 z-20 h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all shadow-xl"
          title="Remover do Portfólio"
        >
          <PinOff size={18} />
        </button>
      )}

      <div className="flex flex-col md:grid md:grid-cols-2 h-full">
        {/* Lado A: Mídia */}
        <div className="relative aspect-square md:aspect-auto h-full overflow-hidden bg-black/20">
          {post.capa_url ? (
            <Image
              src={resolveAssetUrl(post.capa_url)}
              alt={post.titulo}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              unoptimized
            />
          ) : isImage ? (
            <Image
              src={resolveAssetUrl(post.conteudo.url)}
              alt={post.titulo}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-if-purple/20 to-if-olive/20 p-8">
               <div className="text-center">
                  <span className="text-6xl mb-4 block">
                    {post.tipo === 'audio' ? '🎵' : post.tipo === 'video' ? '🎬' : '📄'}
                  </span>
                  <p className="text-xs font-black uppercase tracking-widest text-if-text/40">{post.tipo}</p>
               </div>
            </div>
          )}
          {/* Badge de Posição */}
          <div className="absolute left-6 top-6 h-10 w-10 rounded-2xl bg-if-purple text-white flex items-center justify-center font-black shadow-lg">
            #{post.posicao}
          </div>
        </div>

        {/* Lado B: Info */}
        <div className="flex flex-col justify-center p-8 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="rounded-full bg-if-purple/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-if-purple border border-if-purple/10">
              {post.subtipo || post.tipo}
            </span>
            <span className="text-[10px] font-bold text-if-text/30 flex items-center gap-1">
              <Calendar size={12} />
              {format(new Date(post.createdAt || post.fixado_em), "MMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>

          <h3 className="text-2xl md:text-3xl font-black text-if-text leading-tight mb-4 group-hover:text-if-purple transition-colors">
            {post.titulo}
          </h3>

          <p className="text-sm md:text-base text-if-text/60 leading-relaxed line-clamp-4 mb-8 font-medium italic">
            {post.descricao || 'Este projeto demonstra competências técnicas e criativas desenvolvidas durante a trajetória acadêmica no IFC.'}
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-[10px] font-bold text-if-text/40 bg-white/5 px-2 py-1 rounded-md">
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>

          <Link
            href={`/post/${post._id}`}
            className="inline-flex items-center gap-3 rounded-2xl bg-if-purple px-8 py-4 text-sm font-black text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-if-purple/20 group/btn"
          >
            Ver Detalhes do Projeto
            <ExternalLink size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
