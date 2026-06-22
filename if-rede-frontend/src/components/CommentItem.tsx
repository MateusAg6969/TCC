'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { Comentario, HighlightType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReplyItem from './ReplyItem';

interface CommentItemProps {
  comment: Comentario;
  postId: string;
  onReply: (commentId: string, mentionName?: string) => void;
  onRefresh: () => void;
}

export default function CommentItem({ comment, postId, onReply, onRefresh }: CommentItemProps) {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);

  const isLiked = comment.stats.usuarios_que_curtiram.includes(user?.id || '');
  const isAuthor = user?.id === comment.autor_id._id;
  const isStaff = user?.status_vinculo === 'servidor';

  const handleLike = async () => {
    if (!user) return;
    setIsLiking(true);
    try {
      if (isLiked) {
        await api.delete(`/comentarios/${comment._id}/curtir`);
      } else {
        await api.post(`/comentarios/${comment._id}/curtir`);
      }
      onRefresh();
    } catch (error) {
      console.error('Erro ao curtir:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleHighlight = async (type: HighlightType) => {
    try {
      await api.patch(`/comentarios/${comment._id}/highlight`, { type });
      onRefresh();
    } catch (error) {
      console.error('Erro ao destacar:', error);
    }
  };

  const getHighlightStyles = () => {
    switch (comment.highlight_type) {
      case 'OFFICIAL_ANSWER':
        return 'border-2 border-if-purple bg-if-purple/5 shadow-[0_0_15px_rgba(147,51,234,0.1)]';
      case 'PEDAGOGICAL_HIGHLIGHT':
        return 'border-2 border-if-olive bg-if-olive/5 shadow-[0_0_15px_rgba(132,143,101,0.1)]';
      default:
        return 'border border-white/5 bg-white/5';
    }
  };

  const getBadge = () => {
    if (comment.highlight_type === 'OFFICIAL_ANSWER') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-if-purple text-white px-2 py-0.5 rounded-full">
          <ShieldCheck size={10} /> Resposta Oficial
        </span>
      );
    }
    if (comment.highlight_type === 'PEDAGOGICAL_HIGHLIGHT') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-if-olive text-if-bg px-2 py-0.5 rounded-full">
          <Star size={10} /> Destaque Pedagógico
        </span>
      );
    }
    return null;
  };

  return (
    <div className={`group relative mb-4 rounded-2xl p-4 transition-all ${getHighlightStyles()}`}>
      {/* Badge de Destaque */}
      <div className="absolute -top-2.5 left-4 flex gap-2">
        {getBadge()}
      </div>

      <div className="flex gap-4">
        {/* Avatar */}
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-if-purple/20 flex items-center justify-center font-bold text-if-purple border border-if-purple/10">
          {comment.autor_id.customizacao?.avatar_url ? (
            <Image 
              src={comment.autor_id.customizacao.avatar_url} 
              alt={comment.autor_id.perfil.nome} 
              width={40} 
              height={40} 
              className="h-full w-full object-cover"
            />
          ) : (
            comment.autor_id.perfil.nome.charAt(0).toUpperCase()
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-if-text">
                {comment.autor_id.perfil.nome}
              </span>
              {comment.autor_id.perfil.status_vinculo === 'servidor' && (
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-if-text/40 font-bold uppercase">
                  Staff
                </span>
              )}
              <span className="text-xs text-if-text/30">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
            
            {/* Ações de Moderação/Destaque para Professores */}
            {isStaff && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleToggleHighlight(comment.highlight_type === 'OFFICIAL_ANSWER' ? 'NORMAL' : 'OFFICIAL_ANSWER')}
                  className={`p-1 rounded hover:bg-if-purple/20 transition-colors ${comment.highlight_type === 'OFFICIAL_ANSWER' ? 'text-if-purple' : 'text-if-text/20'}`}
                  title="Marcar como Resposta Oficial"
                >
                  <ShieldCheck size={16} />
                </button>
                <button 
                  onClick={() => handleToggleHighlight(comment.highlight_type === 'PEDAGOGICAL_HIGHLIGHT' ? 'NORMAL' : 'PEDAGOGICAL_HIGHLIGHT')}
                  className={`p-1 rounded hover:bg-if-olive/20 transition-colors ${comment.highlight_type === 'PEDAGOGICAL_HIGHLIGHT' ? 'text-if-olive' : 'text-if-text/20'}`}
                  title="Destaque Pedagógico"
                >
                  <Star size={16} />
                </button>
              </div>
            )}
          </div>

          <p className="text-if-text/80 text-sm leading-relaxed mb-3">
            {comment.texto}
          </p>

          <div className="flex items-center gap-4">
            <button 
              disabled={isLiking || !user}
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isLiked ? 'text-red-500' : 'text-if-text/40 hover:text-red-500'}`}
            >
              <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
              {comment.stats.likes}
            </button>

            <button 
              onClick={() => onReply(comment._id)}
              className="flex items-center gap-1.5 text-xs font-bold text-if-text/40 hover:text-if-purple transition-colors"
            >
              <MessageCircle size={14} />
              Responder
            </button>
          </div>

          {/* Renderização Recursiva de Respostas (apenas 1 nível como definido no controller) */}
          {comment.respostas && comment.respostas.length > 0 && (
            <div className="mt-4 space-y-0 relative">
              {/* Linha Guia Vertical para o Fio (Thread) */}
              <div className="absolute left-[13px] top-0 bottom-6 w-px bg-white/10" />
              {comment.respostas.map(reply => (
                <ReplyItem 
                  key={reply._id}
                  reply={reply}
                  parentCommentId={comment._id}
                  onReply={onReply}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
