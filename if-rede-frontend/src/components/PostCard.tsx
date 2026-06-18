'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, Share2, Pin, ChevronDown, MoreHorizontal, Trash2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Post } from '@/types';
import { useAuth } from '@/context/AuthContext';
import api, { resolveAssetUrl } from '@/lib/api';
import ContadorAlcance from './ContadorAlcance';

/**
 * ============================================================================
 * COMPONENTE: POSTCARD (Versão v2.5 - Portfólio & Alcance)
 * ============================================================================
 * O que faz: Renderiza uma postagem com suporte a fixação no portfólio e contador de alcance.
 */


function textPreview(text?: string) {
  if (!text) return '';
  if (text.length < 180) return text;
  return `${text.slice(0, 180)}...`;
}

interface PostCardProps {
  post: Post;
  isOwner?: boolean;
  isPinned?: boolean;
  onPin?: (position: number) => void;
}

export default function PostCard({ post, isOwner, isPinned, onPin }: PostCardProps) {
  const { user } = useAuth();
  const [curtido, setCurtido] = useState(false);
  const [totalLikes, setTotalLikes] = useState(post.stats?.likes || 0);
  const [carregando, setCarregando] = useState(false);
  const [showPinOptions, setShowPinOptions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [deletando, setDeletando] = useState(false);

  // Efeito: Inicializa o estado de 'curtido' com base nos dados do usuário logado.
  useEffect(() => {
    if (user && post.stats?.usuarios_que_curtiram) {
      const jaCurtiu = post.stats.usuarios_que_curtiram.some(
        (id) => String(id) === String(user.id)
      );
      setCurtido(jaCurtiu);
    }
  }, [user, post.stats?.usuarios_que_curtiram]);

  /**
   * Lidar com o clique no botão de Curtir
   * Fluxo: Atualização Otimista -> Chamada API -> Reversão em caso de erro.
   */
  const handleLike = async () => {
    if (!user || carregando) return;

    const novoEstado = !curtido;
    const novoTotal = novoEstado ? totalLikes + 1 : Math.max(0, totalLikes - 1);

    // 1. Atualização Otimista (Melhora UX significativamente)
    setCurtido(novoEstado);
    setTotalLikes(novoTotal);
    setCarregando(true);

    try {
      if (novoEstado) {
        // Enviar POST para curtir
        await api.post(`/postagens/${post._id}/curtir`);
      } else {
        // Enviar DELETE para descurtir
        await api.delete(`/postagens/${post._id}/curtir`);
      }
    } catch (error) {
      console.error('Erro ao processar curtida:', error);

      // Mostrar toast amigável ao usuário
      if (novoEstado) {
        toast.error('Não foi possível curtir. Verifique sua conexão e tente novamente.');
      } else {
        toast.error('Não foi possível remover a curtida. Tente novamente.');
      }

      // Reverter estado em caso de falha na rede/servidor
      setCurtido(!novoEstado);
      setTotalLikes(totalLikes);
    } finally {
      setCarregando(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.')) return;
    setDeletando(true);
    try {
      await api.delete(`/postagens/${post._id}`);
      toast.success('Postagem excluída com sucesso!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir postagem.');
      setDeletando(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
    setShowOptions(false);
  };

  const tipo = post.tipo;
  const mime = post.conteudo?.arquivo?.mimetype;
  const renderTipo = mime?.startsWith('image/') ? 'imagem'
    : mime?.startsWith('video/') ? 'video'
      : mime?.startsWith('audio/') ? 'audio'
        : 'texto';
  const arquivoUrl = resolveAssetUrl(post.conteudo?.url);
  const autorId = post.autor_id?._id || (post.autor_id as any);
  const avatarUrl = (post.autor_id as any)?.customizacao?.avatar_url;

  return (
    <article className="group overflow-hidden rounded-main bg-if-card border border-if-purple/10 transition-all hover:border-if-purple/30 text-if-text shadow-card">
      <header className="p-4 flex items-center justify-between border-b border-if-purple/5 gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            href={`/profile/${autorId}`}
            className="h-10 w-10 shrink-0 rounded-xl bg-if-purple/20 flex items-center justify-center font-black border border-white/5 overflow-hidden transition-all hover:scale-105 active:scale-95 bg-cover bg-center"
            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}
          >
            {!avatarUrl && (post.autor_id?.perfil?.nome || 'U').charAt(0).toUpperCase()}
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/post/${post._id}`} className="block">
              <h3 className="truncate text-lg font-bold tracking-tight hover:text-if-purple transition-colors" title={post.titulo}>
                {post.titulo}
              </h3>
            </Link>
            <p className="truncate text-xs font-medium text-if-purple/60">
              por{' '}
              <Link
                href={`/profile/${autorId}`}
                className="text-if-purple font-bold hover:underline transition-all"
              >
                {post.autor_id?.perfil?.nome || 'Acadêmico'}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {isOwner && onPin && (
              <div className="relative">
                <button
                  onClick={() => setShowPinOptions(!showPinOptions)}
                  className={`flex h-8 items-center gap-1 rounded-lg px-2 text-[10px] font-black uppercase transition-all ${isPinned
                      ? 'bg-if-purple text-white'
                      : 'bg-white/5 text-if-text/40 hover:bg-if-purple/20 hover:text-if-purple'
                    }`}
                >
                  <Pin size={12} fill={isPinned ? 'currentColor' : 'none'} />
                  {isPinned ? 'Fixado' : 'Fixar'}
                  <ChevronDown size={12} />
                </button>

                {showPinOptions && (
                  <div className="absolute right-0 mt-1 w-32 rounded-xl bg-if-card border border-white/10 shadow-2xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <p className="p-2 text-[9px] font-black text-if-text/30 uppercase border-b border-white/5 bg-black/20">Escolher Posição</p>
                    {[1, 2, 3].map(pos => (
                      <button
                        key={pos}
                        onClick={() => {
                          onPin(pos);
                          setShowPinOptions(false);
                        }}
                        className="w-full p-2 text-left text-[10px] font-bold hover:bg-if-purple hover:text-white transition-colors"
                      >
                        Posição #{pos}
                      </button>
                    ))}
                    {isPinned && (
                      <button
                        onClick={() => {
                          onPin(0); // Tratado no pai como desfixar se necessário ou apenas chama a rota
                          setShowPinOptions(false);
                        }}
                        className="w-full p-2 text-left text-[10px] font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors border-t border-white/5"
                      >
                        Desafixar
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <span className="rounded-full bg-if-purple/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-if-purple border border-if-purple/20">
              {tipo}
            </span>
            <div className="relative">
              <button
                onClick={(e) => { e.preventDefault(); setShowOptions(!showOptions); }}
                className="p-1 text-if-text/40 hover:text-if-purple hover:bg-if-purple/10 rounded-lg transition-colors ml-1"
                aria-label="Opções da postagem"
              >
                <MoreHorizontal size={16} />
              </button>
              {showOptions && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-if-card border border-white/10 shadow-2xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <p className="p-2 text-[9px] font-black text-if-text/30 uppercase border-b border-white/5 bg-black/20">Opções</p>

                  <button
                    onClick={(e) => { e.preventDefault(); handleCopyLink(); }}
                    className="w-full flex items-center gap-3 p-3 text-left text-xs font-bold hover:bg-white/5 transition-colors"
                  >
                    <LinkIcon size={14} /> Copiar Link
                  </button>

                  {user?.id === autorId && (
                    <button
                      onClick={(e) => { e.preventDefault(); handleDelete(); }}
                      disabled={deletando}
                      className="w-full flex items-center gap-3 p-3 text-left text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors border-t border-white/5"
                    >
                      <Trash2 size={14} /> {deletando ? 'Excluindo...' : 'Excluir Postagem'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="text-[9px] text-gray-400 font-mono">
            ID: {post._id.slice(-6).toUpperCase()}
          </p>
        </div>
      </header>

      {/* Área de Conteúdo */}
      <Link href={`/post/${post._id}`} className="block p-4 group-hover:bg-white/5 transition-colors">
        {renderTipo === 'texto' && (
          <div className="rounded-xl bg-if-bg/50 p-4 border border-if-purple/5">
            <p className="leading-relaxed text-if-text/90 italic">
              "{textPreview(post.conteudo?.texto_longo)}"
            </p>
          </div>
        )}

        {renderTipo === 'imagem' && arquivoUrl && (
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-if-purple/10">
            <Image
              src={arquivoUrl}
              alt={post.titulo}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized
            />
          </div>
        )}

        {renderTipo === 'audio' && arquivoUrl && (
          <div className="rounded-xl bg-if-purple/5 p-4 border border-if-purple/10">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-if-purple text-white animate-pulse">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-if-purple">{post.subtipo || 'Produção Sonora'}</p>
                <p className="text-[10px] text-gray-500">Streaming via Servidor IF REDE</p>
              </div>
            </div>
            <audio
              className="w-full h-10 mt-2"
              controls
              src={arquivoUrl}
              onClick={(e) => e.preventDefault()} // impede clique de ir para a página do post
            >
              Seu navegador não suporta áudio.
            </audio>
          </div>
        )}

        {renderTipo === 'video' && arquivoUrl && (
          <div className="relative aspect-video overflow-hidden rounded-xl border border-if-purple/10 bg-black flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
            <video
              src={arquivoUrl}
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              muted
              loop
              playsInline
              onMouseEnter={(e) => {
                const v = e.target as HTMLVideoElement;
                const promise = v.play();
                if (promise !== undefined) {
                  promise.catch(err => console.warn('Autoplay prevented or unsupported:', err));
                }
              }}
              onMouseLeave={(e) => {
                const v = e.target as HTMLVideoElement;
                v.pause();
                v.currentTime = 0;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
            <div className="z-20 flex h-12 w-12 items-center justify-center rounded-full bg-if-olive text-if-bg shadow-xl group-hover:scale-110 transition-transform pointer-events-none">
              <Sparkles size={24} />
            </div>
          </div>
        )}
      </Link>

      {/* Footer com Interações */}
      <footer className="bg-if-purple/5 p-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            disabled={!user || carregando}
            aria-label={curtido ? 'Descurtir' : `Curtir, ${totalLikes} curtidas`}
            className={`flex items-center gap-2 text-sm font-bold transition-all duration-300 ${curtido ? 'text-red-500 scale-110' : 'text-gray-500 hover:text-if-purple'
              }`}
          >
            <Heart
              size={20}
              className={curtido ? 'fill-current' : ''}
            />
            {totalLikes}
          </button>

          <button
            aria-label={`Comentar, ${post.stats?.comentarios_count || 0} comentários`}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-if-purple transition-colors"
          >
            <MessageCircle size={20} /> {post.stats?.comentarios_count || 0}
          </button>

          <button
            aria-label={`Republicar, ${post.stats?.shares || 0} republicações`}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-if-purple transition-colors"
          >
            <Repeat2 size={20} /> {post.stats?.shares || 0}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <ContadorAlcance
            postId={post._id}
            alcanceInicial={post.stats?.alcance || 0}
            isAutor={user?.id === autorId}
          />
          <div className="text-[10px] font-medium text-gray-400">
            {new Date(post.createdAt || '').toLocaleDateString('pt-BR')}
          </div>
        </div>
      </footer>
    </article>
  );
}

// Helper icon for audio
function Sparkles({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}
