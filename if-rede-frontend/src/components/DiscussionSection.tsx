'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { Comentario } from '@/types';
import api from '@/lib/api';
import CommentItem from './CommentItem';
import { useAuth } from '@/context/AuthContext';

interface DiscussionSectionProps {
  postId: string;
}

export default function DiscussionSection({ postId }: DiscussionSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await api.get(`/comentarios/postagem/${postId}`);
      setComments(res.data?.data || []);
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
    
    // Auto-focus no campo de comentário se acessado via link de notificação/botão
    if (window.location.hash === '#comments') {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await api.post('/comentarios', {
        postagem_id: postId,
        texto: newComment,
        parent_id: replyTo
      });
      setNewComment('');
      setReplyTo(null);
      // Como o comentário vai para moderação, ele não aparecerá imediatamente
      // a menos que o backend pré-aprove. No nosso caso, mostramos um alerta.
      alert('Seu comentário foi enviado para moderação acadêmica.');
      fetchComments();
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const replyingToComment = comments.find(c => c._id === replyTo);

  return (
    <section id="comments" className="mt-8 rounded-3xl bg-if-card p-6 md:p-8 border border-white/5 shadow-xl">
      <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-if-text">
        <MessageCircle size={24} className="text-if-purple" />
        Discussão Acadêmica
      </h3>

      {/* Input de Novo Comentário */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 group">
          {replyTo && (
            <div className="flex items-center justify-between bg-if-purple/10 px-4 py-2 rounded-t-2xl border-x border-t border-if-purple/20">
              <span className="text-xs font-bold text-if-purple">
                Respondendo a {replyingToComment?.autor_id.perfil.nome}
              </span>
              <button 
                type="button" 
                onClick={() => setReplyTo(null)}
                className="text-if-purple hover:bg-if-purple/20 rounded-full p-1"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className={`relative flex items-end gap-3 bg-white/5 p-3 border transition-all ${replyTo ? 'rounded-b-2xl border-if-purple/20' : 'rounded-2xl border-white/5 focus-within:border-if-purple/30'}`}>
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo ? "Escreva sua resposta..." : "Inicie uma contribuição acadêmica..."}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none min-h-[45px] max-h-[200px]"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="shrink-0 h-10 w-10 rounded-xl bg-if-purple text-white flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-if-purple/20"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="mt-2 text-[10px] text-if-text/30 font-medium px-2 italic">
            Contribuições passam por curadoria pedagógica.
          </p>
        </form>
      ) : (
        <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center">
          <p className="text-sm text-if-text/40 font-medium">
            Faça login para participar da discussão.
          </p>
        </div>
      )}

      {/* Lista de Comentários */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-10 text-center text-if-text/20 animate-pulse font-bold uppercase tracking-widest text-xs">
            Carregando discussões...
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              onReply={(id, mentionName) => {
                setReplyTo(id);
                if (mentionName) {
                  setNewComment(`@${mentionName} `);
                } else {
                  setNewComment('');
                }
                setTimeout(() => textareaRef.current?.focus(), 100);
              }}
              onRefresh={fetchComments}
            />
          ))
        ) : (
          <div className="text-center py-10 text-if-text/40 italic font-medium border-2 border-dashed border-white/5 rounded-2xl">
            Ainda não há contribuições. Seja o primeiro a comentar!
          </div>
        )}
      </div>
    </section>
  );
}
