'use client';

import { Post } from '@/types';
import Image from 'next/image';
import { Check, X, AlertTriangle, User, Calendar, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ModerationCardProps {
  post: Post;
  onApprove: (postId: string) => void;
  onReject: (postId: string) => void;
  isProcessing: boolean;
}

export default function ModerationCard({ post, onApprove, onReject, isProcessing }: ModerationCardProps) {
  const autor = post.autor_id as any;
  const motivo = post.denuncias?.motivos?.[0]?.motivo || 'Retido pelo filtro automático';

  return (
    <div className="rounded-3xl bg-if-card border border-white/5 overflow-hidden shadow-2xl transition-all hover:border-white/10">
      <div className="p-6">
        {/* Header: Autor e Data */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-if-purple/20 flex items-center justify-center font-bold text-if-purple overflow-hidden border border-if-purple/10">
              {autor?.customizacao?.avatar_url ? (
                <Image src={autor.customizacao.avatar_url} alt={autor?.perfil?.nome} width={40} height={40} className="object-cover" />
              ) : (
                <User size={20} />
              )}
            </div>
            <div>
              <p className="text-sm font-black text-if-text">{autor?.perfil?.nome || 'Usuário Desconhecido'}</p>
              <p className="text-[10px] text-if-text/40 font-bold uppercase tracking-widest flex items-center gap-1">
                <Calendar size={10} />
                {format(new Date(post.createdAt || ''), "dd 'de' MMM, HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
             <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase px-2 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
                <AlertTriangle size={10} /> Pendente
             </span>
          </div>
        </div>

        {/* Motivo da Retenção */}
        <div className="mb-4 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <MessageSquare size={10} /> Motivo da Análise
          </p>
          <p className="text-xs text-if-text/70 font-medium italic">"{motivo}"</p>
        </div>

        {/* Conteúdo do Post */}
        <div className="mb-6">
          <h4 className="font-black text-if-text mb-2 line-clamp-1">{post.titulo}</h4>
          {post.tipo === 'texto' ? (
            <p className="text-sm text-if-text/60 line-clamp-3 italic leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
              "{post.conteudo.texto_longo}"
            </p>
          ) : (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/40 group">
               {post.tipo === 'imagem' ? (
                 <Image src={post.conteudo.url} alt={post.titulo} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" unoptimized />
               ) : (
                 <div className="flex h-full items-center justify-center text-if-text/20">
                    <span className="text-xs font-black uppercase">{post.tipo}</span>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <button
            onClick={() => onApprove(post._id)}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            <Check size={18} /> Aprovar
          </button>
          <button
            onClick={() => onReject(post._id)}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-black py-3 rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-rose-500/20"
          >
            <X size={18} /> Rejeitar
          </button>
        </div>
      </div>
    </div>
  );
}
