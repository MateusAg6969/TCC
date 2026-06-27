'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, Share2, Pin, ChevronDown, MoreHorizontal, Trash2, Link as LinkIcon, Bookmark, Music, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { Post } from '@/types';
import { useAuth } from '@/context/AuthContext';
import api, { resolveAssetUrl } from '@/lib/api';
import ContadorAlcance from './ContadorAlcance';
import ConfirmModal from './ConfirmModal';

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
  onDelete?: (postId: string) => void;
}

export default function PostCard({ post, isOwner, isPinned, onPin, onDelete }: PostCardProps) {
  const { user, toggleSavePost } = useAuth();
  const [curtido, setCurtido] = useState(false);
  const [totalLikes, setTotalLikes] = useState(post.stats?.likes || 0);
  const [carregando, setCarregando] = useState(false);
  const [showPinOptions, setShowPinOptions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [revelado, setRevelado] = useState(false);

  const salvo = user?.postagens_salvas?.includes(post._id) || false;

  const handleSave = async () => {
    if (!user || salvando) return;

    setSalvando(true);
    toggleSavePost(post._id);

    try {
      const res = await api.post(`/usuarios/me/salvas/${post._id}`);
      const isNowSaved = res.data?.data?.salvo;
      toast.success(isNowSaved ? 'Postagem salva!' : 'Postagem removida dos salvos.');
    } catch (error) {
      console.error('Erro ao salvar postagem:', error);
      toast.error('Não foi possível salvar a postagem. Tente novamente.');
      toggleSavePost(post._id);
    } finally {
      setSalvando(false);
    }
  };

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
    setShowDeleteModal(false);
    setDeletando(true);
    try {
      await api.delete(`/postagens/${post._id}`);
      toast.success('Postagem excluída com sucesso!');
      if (onDelete) {
        onDelete(post._id);
      } else {
        window.location.reload();
      }
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
    <>
      <motion.article 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="group overflow-hidden rounded-main bg-if-card/90 backdrop-blur-md border border-white/5 transition-colors duration-300 hover:border-if-purple/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] text-if-text"
      >
      <header className="p-3 sm:p-4 flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-transparent via-transparent to-if-purple/5 gap-2 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            href={`/profile/${autorId}`}
            className="h-10 w-10 shrink-0 rounded-xl bg-if-purple/20 flex items-center justify-center font-black border border-white/5 overflow-hidden transition-all hover:scale-105 active:scale-95 bg-cover bg-center"
            style={avatarUrl ? { backgroundImage: `url(${resolveAssetUrl(avatarUrl)})` } : {}}
          >
            {!avatarUrl && (post.autor_id?.perfil?.apelido || post.autor_id?.perfil?.nome || 'U').charAt(0).toUpperCase()}
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
                {post.autor_id?.perfil?.apelido || post.autor_id?.perfil?.nome || 'Acadêmico'}
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
                      onClick={(e) => { e.preventDefault(); setShowOptions(false); setShowDeleteModal(true); }}
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

      <Link href={`/post/${post._id}`} className="block p-3 sm:p-4 group-hover:bg-white/5 transition-colors">
        {renderTipo === 'texto' && (
          <div className="rounded-xl bg-if-bg/50 overflow-hidden border border-if-purple/5">
            {post.capa_url && (
              <div className="relative h-40 w-full border-b border-white/5 bg-black/20">
                <Image
                  src={resolveAssetUrl(post.capa_url)}
                  alt="Capa do texto"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="p-4">
              <p className="leading-relaxed text-if-text/90 italic">
                "{textPreview(post.conteudo?.texto_longo)}"
              </p>
            </div>
          </div>
        )}

        {renderTipo === 'imagem' && arquivoUrl && (
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-if-purple/10 bg-black">
            {post.capa_url && !revelado ? (
              <div className="relative w-full h-full">
                <Image
                  src={resolveAssetUrl(post.capa_url)}
                  alt="Capa de spoiler"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4">
                  <span className="text-xs font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                    ⚠️ Prévia / Spoiler
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRevelado(true);
                    }}
                    className="mt-2 rounded-xl bg-if-olive px-4 py-2 text-xs font-bold text-if-bg hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    Revelar Imagem
                  </button>
                </div>
              </div>
            ) : (
              <Image
                src={arquivoUrl}
                alt={post.titulo}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized
              />
            )}
          </div>
        )}

        {renderTipo === 'audio' && arquivoUrl && (
          <div className="rounded-xl bg-if-purple/5 overflow-hidden border border-if-purple/10">
            {post.capa_url ? (
              <div className="relative aspect-video sm:aspect-[16/10] w-full bg-black/20">
                <Image
                  src={resolveAssetUrl(post.capa_url)}
                  alt="Capa do áudio"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-if-purple text-white animate-pulse">
                  <Music size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-if-purple">{post.subtipo || 'Produção Sonora'}</p>
                  <p className="text-[10px] text-gray-500">Streaming via Servidor IF REDE</p>
                </div>
              </div>
            )}
            <div className="p-3 bg-black/20 border-t border-white/5">
              <audio
                className="w-full h-10"
                controls
                src={arquivoUrl}
                onClick={(e) => e.preventDefault()}
              >
                Seu navegador não suporta áudio.
              </audio>
            </div>
          </div>
        )}

        {renderTipo === 'video' && arquivoUrl && (
          <div className="relative aspect-video overflow-hidden rounded-xl border border-if-purple/10 bg-black flex items-center justify-center">
            {post.capa_url && !revelado ? (
              <div className="relative w-full h-full">
                <Image
                  src={resolveAssetUrl(post.capa_url)}
                  alt="Capa de spoiler"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-2 p-4">
                  <span className="text-xs font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                    ⚠️ Prévia / Spoiler
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRevelado(true);
                    }}
                    className="mt-2 rounded-xl bg-if-olive px-4 py-2 text-xs font-bold text-if-bg hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    Revelar Vídeo
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                  <Play size={24} className="fill-current ml-1" />
                </div>
              </>
            )}
          </div>
        )}
      </Link>

      {/* Footer com Interações */}
      <footer className="bg-if-purple/5 p-2 px-3 sm:p-3 sm:px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleLike}
            disabled={!user || carregando}
            aria-label={curtido ? 'Descurtir' : `Curtir, ${totalLikes} curtidas`}
            className={`flex items-center gap-2 text-sm font-bold transition-colors duration-300 ${curtido ? 'text-red-500' : 'text-gray-500 hover:text-if-purple'
              }`}
          >
            <Heart
              size={20}
              className={curtido ? 'fill-current' : ''}
            />
            {totalLikes}
          </motion.button>

          <Link
            href={`/post/${post._id}#comments`}
            aria-label={`Comentar, ${post.stats?.comentarios_count || 0} comentários`}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-if-purple transition-colors"
          >
            <MessageCircle size={20} /> {post.stats?.comentarios_count || 0}
          </Link>

          <button
            aria-label={`Republicar, ${post.stats?.shares || 0} republicações`}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-if-purple transition-colors"
          >
            <Repeat2 size={20} /> {post.stats?.shares || 0}
          </button>

          <button
            onClick={handleSave}
            disabled={!user || salvando}
            aria-label={salvo ? 'Remover dos salvos' : 'Salvar postagem'}
            className={`flex items-center gap-2 text-sm font-bold transition-colors duration-300 ${salvo ? 'text-if-olive' : 'text-gray-500 hover:text-if-purple'}`}
          >
            <Bookmark size={20} className={salvo ? 'fill-current' : ''} />
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
    </motion.article>
    <ConfirmModal 
      isOpen={showDeleteModal}
      title="Excluir Postagem"
      message="Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita e todos os comentários e reações serão perdidos."
      confirmText="Excluir"
      onConfirm={handleDelete}
      onCancel={() => setShowDeleteModal(false)}
    />
    </>
  );
}


