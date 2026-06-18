import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, MessageCircle, Repeat2, Share2, Calendar, User, Tag } from 'lucide-react';
import { serverGet } from '@/lib/server-api';
import type { ApiSuccess, Post } from '@/types';
import { notFound } from 'next/navigation';

function resolveAssetUrl(url?: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // Se a URL já começar com /uploads, não duplicamos
  if (url.startsWith('/uploads') || url.startsWith('uploads')) {
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${apiUrl}${cleanUrl}`;
  }

  // Caso padrão: adiciona /uploads/postagens/
  return `${apiUrl}/uploads/postagens/${url.startsWith('/') ? url.slice(1) : url}`;
}

async function getPost(id: string) {
  const res = await serverGet<ApiSuccess<Post>>(`/postagens/${id}`);
  return res?.data || null;
}

export default async function PostDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  const arquivoUrl = resolveAssetUrl(post.conteudo?.url);
  const autorId = post.autor_id?._id || (post.autor_id as any);
  const avatarUrl = (post.autor_id as any)?.customizacao?.avatar_url;

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
                    <span className="h-1 w-1 rounded-full bg-if-text/20" />
                    <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] bg-if-purple/10 px-2 py-0.5 rounded text-if-purple border border-if-purple/20">{post.tipo}</span>
                  </div>
                </div>
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
            {post.tipo === 'imagem' && arquivoUrl && (
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

            {post.tipo === 'video' && arquivoUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-xl border border-white/5 bg-black">
                <video 
                  src={arquivoUrl} 
                  controls 
                  className="w-full h-full"
                >
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

            {(post.tipo === 'audio' || post.tipo === 'msc') && arquivoUrl && (
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

            {post.tipo === 'texto' && !post.conteudo?.texto_longo && arquivoUrl && (
              <div className="rounded-2xl bg-if-olive/5 p-10 border-2 border-dashed border-if-olive/20 text-center">
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
                aria-label={`Curtir, ${post.stats?.likes || 0} curtidas`}
                className="flex items-center gap-2 text-lg font-black text-if-text/60 hover:text-red-500 transition-all group"
              >
                <Heart size={28} className="group-hover:scale-110 transition-transform" />
                {post.stats?.likes || 0}
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

        {/* Comentários (Espaço reservado para futura implementação) */}
        <section className="mt-8 rounded-3xl bg-if-card p-8 border border-white/5">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <MessageCircle size={24} className="text-if-purple" />
            Discussão Acadêmica
          </h3>
          <div className="text-center py-10 text-if-text/40 italic font-medium border-2 border-dashed border-white/5 rounded-2xl">
            A seção de comentários será ativada em breve.
          </div>
        </section>
      </div>
    </main>
  );
}
