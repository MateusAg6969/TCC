'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';
import { Comentario } from '@/types';
import { useAuth } from '@/context/AuthContext';
import api, { resolveAssetUrl } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReplyItemProps {
  reply: Comentario;
  parentCommentId: string;
  onReply: (commentId: string, mentionName?: string) => void;
  onRefresh: () => void;
}

export default function ReplyItem({ reply, parentCommentId, onReply, onRefresh }: ReplyItemProps) {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);

  const [localLiked, setLocalLiked] = useState(reply.stats.usuarios_que_curtiram.includes(user?.id || ''));
  const [localLikesCount, setLocalLikesCount] = useState(reply.stats.likes);

  const handleLike = async () => {
    if (!user) return;
    
    const newLiked = !localLiked;
    const newCount = newLiked ? localLikesCount + 1 : Math.max(0, localLikesCount - 1);
    
    setLocalLiked(newLiked);
    setLocalLikesCount(newCount);
    setIsLiking(true);
    
    try {
      if (newLiked) {
        await api.post(`/comentarios/${reply._id}/curtir`);
      } else {
        await api.delete(`/comentarios/${reply._id}/curtir`);
      }
      onRefresh();
    } catch (error) {
      console.error('Erro ao curtir resposta:', error);
      setLocalLiked(!newLiked);
      setLocalLikesCount(localLikesCount);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="flex gap-3 relative group/reply mt-3">
      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-if-purple/10 flex items-center justify-center text-[10px] font-bold text-if-purple/60 border border-if-purple/10 z-10">
        {reply.autor_id.customizacao?.avatar_url ? (
          <Image 
            src={resolveAssetUrl(reply.autor_id.customizacao.avatar_url)} 
            alt={reply.autor_id.perfil.nome} 
            width={28} 
            height={28} 
            className="h-full w-full object-cover"
          />
        ) : (
          (reply.autor_id.perfil.apelido || reply.autor_id.perfil.nome).charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-if-text/70">{reply.autor_id.perfil.apelido || reply.autor_id.perfil.nome}</span>
          {reply.autor_id.perfil.status_vinculo === 'servidor' && (
            <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded text-if-text/40 font-bold uppercase">
              Staff
            </span>
          )}
          <span className="text-[10px] text-if-text/20">
            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
        <p className="text-xs text-if-text/60 leading-relaxed mb-1.5">{reply.texto}</p>
        
        {/* Ações da Resposta */}
        <div className="flex items-center gap-3">
          <button 
            disabled={isLiking || !user}
            onClick={handleLike}
            className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${localLiked ? 'text-red-500' : 'text-if-text/30 hover:text-red-500'}`}
          >
            <Heart size={12} fill={localLiked ? 'currentColor' : 'none'} />
            {localLikesCount}
          </button>

          <button 
            onClick={() => onReply(parentCommentId, reply.autor_id.perfil.apelido || reply.autor_id.perfil.nome)}
            className="flex items-center gap-1 text-[10px] font-bold text-if-text/30 hover:text-if-purple transition-colors"
          >
            <MessageCircle size={12} />
            Responder
          </button>
        </div>
      </div>
    </div>
  );
}
