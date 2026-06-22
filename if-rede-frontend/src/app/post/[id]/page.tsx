'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, MessageCircle, Repeat2, Share2, Calendar, User, Tag, MoreHorizontal, Trash2, Link as LinkIcon } from 'lucide-react';
import { serverGet } from '@/lib/server-api';
import type { ApiSuccess, Post } from '@/types';
import { notFound, useRouter } from 'next/navigation';
import DiscussionSection from '@/components/DiscussionSection';
import ContadorAlcance from '@/components/ContadorAlcance';
import api, { resolveAssetUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useEffect, useRef, useState, use } from 'react';

export default function PostDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [curtido, setCurtido] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const hasRegistered = useRef(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await api.get<ApiSuccess<Post>>(`/postagens/${id}`);
        setPost(res.data.data);
        setTotalLikes(res.data.data.stats?.likes || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  useEffect(() => {
    if (user && post && post.stats?.usuarios_que_curtiram) {
      const jaCurtiu = post.stats.usuarios_que_curtiram.some(
        (uid: any) => String(uid) === String(user.id)
      );
      setCurtido(jaCurtiu);
    }
  }, [user, post]);

  const handleLike = async () => {
    if (!user || likeLoading || !post) return;

    const novoEstado = !curtido;
    const novoTotal = novoEstado ? totalLikes + 1 : Math.max(0, totalLikes - 1);

    setCurtido(novoEstado);
    setTotalLikes(novoTotal);
    setLikeLoading(true);

    try {
      if (novoEstado) {
        await api.post(`/postagens/${post._id}/curtir`);
      } else {
        await api.delete(`/postagens/${post._id}/curtir`);
      }
    } catch (error) {
      console.error('Erro ao processar curtida:', error);
      if (novoEstado) {
        toast.error('Não foi possível curtir.');
      } else {
        toast.error('Não foi possível remover a curtida.');
      }
      setCurtido(!novoEstado);
      setTotalLikes(totalLikes);
    } finally {
      setLikeLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !post || hasRegistered.current) return;
    
    const autorId = String(post.autor_id?._id || post.autor_id);
    if (user.id === autorId) return;
    
    hasRegistered.current = true;
    api.post(`/postagens/${id}/visualizar`).catch((err) => {
      console.error('Erro ao registrar visualização:', err);
      // Em caso de erro real, permitimos tentar registrar em um futuro render/re-mount
      hasRegistered.current = false;
    });
  }, [id, user, post]);

  if (loading) return <div className="min-h-screen bg-if-bg flex items-center justify-center font-bold text-if-purple animate-pulse">Carregando...</div>;
  if (!post) return notFound();

  const arquivoUrl = resolveAssetUrl(post.conteudo?.url);
  const mime = post.conteudo?.arquivo?.mimetype;
  const renderTipo = mime?.startsWith('image/') ? 'imagem' 
                   : mime?.startsWith('video/') ? 'video'
                   : mime?.startsWith('audio/') ? 'audio'
                   : 'texto';

  const autorId = post.autor_id?._id || (post.autor_id as any);
  const avatarUrl = (post.autor_id as any)?.customizacao?.avatar_url;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado!');
    setShowOptions(false);
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.')) return;
    setDeletando(true);
    try {
      await api.delete(`/postagens/${post._id}`);
      router.push('/home');
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir postagem.');
      setDeletando(false);
    }
  };

  return (
    <main className="min-h-screen bg-if-bg text-if-text pb-20">
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        {/* Navegação de Volta */}
        <Link 
          href="/home" 
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-if-text/60 hover:text-if-purple transition-all group"
        >
          <div className="rounded-full bg-if-card p-2 group-hover:bg-if-purple/10">
            <ArrowLeft size={20} />
          </div>
          Voltar para o Feed
        </Link>

        <article className="overflow-hidden rounded-3xl bg-if-card shadow-2xl border border-white/5">
          {/* Cabeçalho do Post */}
          <header className="p-6 md:p-10 border-b border-white/5 bg-gradient-to-b from-if-purple/5 to-transparent">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Link 
                  href={`/profile/${autorId}`}
                  className="h-14 w-14 rounded-2xl bg-if-purple/20 flex items-center justify-center font-black text-xl border-2 border-if-purple/20 overflow-hidden transition-all hover:scale-105 active:scale-95 bg-cover bg-center"
                  style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}
                >
                  {!avatarUrl && (post.autor_id?.perfil?.nome || 'U').charAt(0).toUpperCase()}
                </Link>
                <div>
                  <Link 
                    href={`/profile/${autorId}`}
                    className="text-xl font-black text-if-purple hover:underline"
                  >
                    {post.autor_id?.perfil?.nome || 'Acadêmico'}
                  </Link>
                  <div className="flex items-center gap-3 text-sm text-if-text/50 font-medium mt-1">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(post.createdAt || '').toLocaleDateString('pt-BR')}</span>
                    <ContadorAlcance 
                      postId={post._id} 
                      alcanceInicial={post.stats?.alcance || 0} 
                      isAutor={user?.id === autorId} 
                    />
                    <span className="h-1 w-1 rounded-full bg-if-text/20" />
                    <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] bg-if-purple/10 px-2 py-0.5 rounded text-if-purple border border-if-purple/20">{post.tipo}</span>
                  </div>
                </div>
              </div>

              {/* Botão de Opções */}
              <div className="relative">
                <button 
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-2 text-if-text/40 hover:text-if-purple hover:bg-if-purple/10 rounded-xl transition-colors"
                  aria-label="Opções da postagem"
                >
                  <MoreHorizontal size={24} />
                </button>
                {showOptions && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-if-card border border-white/10 shadow-2xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <p className="p-2 text-[9px] font-black text-if-text/30 uppercase border-b border-white/5 bg-black/20">Opções</p>
                    
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-3 p-3 text-left text-xs font-bold hover:bg-white/5 transition-colors"
                    >
                      <LinkIcon size={14} /> Copiar Link
                    </button>
                    
                    {user?.id === autorId && (
                      <button
                        onClick={handleDelete}
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

            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              {post.titulo}
            </h1>
            
            {post.descricao && (
              <p className="mt-4 text-lg text-if-text/70 font-medium leading-relaxed italic">
                {post.descricao}
              </p>
            )}
          </header>

          {/* Área de Conteúdo Central */}
          <div className="p-6 md:p-10">
            {renderTipo === 'imagem' && arquivoUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-xl border border-white/5">
                <Image 
                  src={arquivoUrl} 
                  alt={post.titulo} 
                  fill 
                  className="object-contain bg-black/20" 
                  unoptimized 
                />
              </div>
            )}

            {renderTipo === 'video' && arquivoUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-xl border border-white/5 bg-black">
                <video 
                  controls 
                  className="w-full h-full"
                  playsInline
                >
                  <source src={arquivoUrl} type="video/mp4" />
                  Seu navegador não suporta vídeos.
                </video>
              </div>
            )}

            {post.tipo === 'texto' && post.conteudo?.texto_longo && (
              <div className="prose prose-invert max-w-none">
                <div className="rounded-2xl bg-black/20 p-8 border border-white/5 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                  {post.conteudo.texto_longo}
                </div>
              </div>
            )}

            {renderTipo === 'audio' && arquivoUrl && (
              <div className="rounded-2xl bg-gradient-to-br from-if-purple/10 to-if-olive/10 p-10 border border-white/10 text-center">
                <div className="mx-auto w-24 h-24 rounded-full bg-if-purple flex items-center justify-center text-white mb-6 shadow-lg shadow-if-purple/40 animate-pulse">
                  <Tag size={40} />
                </div>
                <h4 className="text-2xl font-black text-if-purple mb-2">{post.subtipo || 'Produção Sonora'}</h4>
                <p className="text-sm text-if-text/50 mb-8 font-medium">Player Acadêmico IF REDE</p>
                <audio className="w-full h-14" controls src={arquivoUrl}>
                  Seu navegador não suporta áudio.
                </audio>
              </div>
            )}

            {renderTipo === 'texto' && arquivoUrl && (
              <div className="rounded-2xl bg-if-olive/5 p-10 border-2 border-dashed border-if-olive/20 text-center mt-6">
                <h3 className="text-xl font-bold text-if-olive mb-4">Documento Acadêmico Disponível</h3>
                <a
                  href={arquivoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 rounded-full bg-if-olive px-10 py-4 text-lg font-black text-if-bg shadow-xl hover:brightness-110 active:scale-95 transition-all"
                >
                  <Share2 size={24} /> Visualizar Arquivo Completo
                </a>
              </div>
            )}
          </div>

          {/* Footer de Interação */}
          <footer className="bg-white/5 p-6 md:px-10 flex flex-wrap items-center justify-between gap-6 border-t border-white/5">
            <div className="flex items-center gap-8">
              <button 
                onClick={handleLike}
                disabled={!user || likeLoading}
                aria-label={curtido ? 'Descurtir' : `Curtir, ${totalLikes} curtidas`}
                className={`flex items-center gap-2 text-lg font-black transition-all duration-300 group ${curtido ? 'text-red-500 scale-110' : 'text-if-text/60 hover:text-if-purple'}`}
              >
                <Heart size={28} className={curtido ? 'fill-current' : 'group-hover:scale-110 transition-transform'} />
                {totalLikes}
              </button>
              
              <button 
                aria-label={`Comentar, ${post.stats?.comentarios_count || 0} comentários`}
                className="flex items-center gap-2 text-lg font-black text-if-text/60 hover:text-if-purple transition-all group"
              >
                <MessageCircle size={28} className="group-hover:scale-110 transition-transform" />
                {post.stats?.comentarios_count || 0}
              </button>
              
              <button 
                aria-label={`Republicar, ${post.stats?.shares || 0} republicações`}
                className="flex items-center gap-2 text-lg font-black text-if-text/60 hover:text-if-purple transition-all group"
              >
                <Repeat2 size={28} className="group-hover:scale-110 transition-transform" />
                {post.stats?.shares || 0}
              </button>
            </div>

            <div className="flex gap-2">
              {post.tags?.map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-if-text/40 border border-white/5">
                  #{tag}
                </span>
              ))}
            </div>
          </footer>
        </article>

        {/* Discussão Acadêmica Real */}
        <DiscussionSection postId={post._id} />
      </div>
    </main>
  );
}
