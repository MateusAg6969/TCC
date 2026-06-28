'use client';

import { useMemo, useState } from 'react';
import type { Post, PortfolioItem } from '@/types';
import PostCard from './PostCard';
import PortfolioCard from './PortfolioCard';
import { Briefcase, LayoutGrid, Music, FileText, Image as ImageIcon, Bookmark } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

type Tab = 'Portfólio' | 'Postagens' | 'Msc' | 'Text' | 'Img' | 'Salvos';

interface ProfileTabsProps {
  posts: Post[];
  userId: string;
  isOwner: boolean;
  initialPortfolio?: PortfolioItem[];
  onPostDelete?: (postId: string) => void;
}

export default function ProfileTabs({ 
  posts, 
  userId,
  isOwner,
  initialPortfolio = [],
  onPostDelete
}: ProfileTabsProps) {
  const { user } = useAuth();
  const [active, setActive] = useState<Tab>('Portfólio');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(initialPortfolio);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [hasLoadedSaved, setHasLoadedSaved] = useState(false);

  const availableTabs = useMemo(() => {
    const list: Tab[] = ['Portfólio', 'Postagens', 'Msc', 'Text', 'Img'];
    if (isOwner) {
      list.push('Salvos');
    }
    return list;
  }, [isOwner]);

  const filteredPosts = useMemo(() => {
    if (active === 'Postagens') return posts;
    if (active === 'Msc') return posts.filter((p) => p.tipo === 'audio' || p.tipo === 'msc');
    if (active === 'Text') return posts.filter((p) => p.tipo === 'texto');
    if (active === 'Img') return posts.filter((p) => p.tipo === 'imagem');
    return [];
  }, [active, posts]);

  const displayedSavedPosts = useMemo(() => {
    if (!user) return [];
    return savedPosts.filter((p) => user.postagens_salvas.includes(p._id));
  }, [savedPosts, user?.postagens_salvas]);

  const handleTabChange = async (tab: Tab) => {
    setActive(tab);
    if (tab === 'Salvos' && !hasLoadedSaved) {
      setLoadingSaved(true);
      try {
        const res = await api.get('/usuarios/me/salvas');
        setSavedPosts(res.data?.data || []);
        setHasLoadedSaved(true);
      } catch (error) {
        console.error('Erro ao buscar postagens salvas:', error);
        toast.error('Erro ao carregar postagens salvas.');
      } finally {
        setLoadingSaved(false);
      }
    }
  };

  const handlePin = async (postId: string, position: number) => {
    try {
      const res = await api.patch('/portfolio/pin', { postagem_id: postId, posicao: position });
      if (res.data.ok) {
        // Recarregar portfólio
        const resPort = await api.get(`/portfolio/usuario/${userId}`);
        setPortfolio(resPort.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao fixar postagem.');
    }
  };

  const handleUnpin = async (postId: string) => {
    try {
      await api.patch('/portfolio/pin', { postagem_id: postId });
      setPortfolio(prev => prev.filter(p => p._id !== postId));
    } catch (error) {
      console.error('Erro ao desafixar:', error);
    }
  };

  const getTabIcon = (tab: Tab) => {
    switch (tab) {
      case 'Portfólio': return <Briefcase size={16} />;
      case 'Postagens': return <LayoutGrid size={16} />;
      case 'Msc': return <Music size={16} />;
      case 'Text': return <FileText size={16} />;
      case 'Img': return <ImageIcon size={16} />;
      case 'Salvos': return <Bookmark size={16} />;
    }
  };

  return (
    <section>
      <div className="mb-8 flex flex-wrap gap-3 border-b border-white/5 pb-6">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black transition-all ${
              active === tab 
                ? 'bg-if-purple text-white shadow-xl shadow-if-purple/20 scale-105' 
                : 'bg-if-card text-if-text/40 hover:bg-white/5 hover:text-if-text hover:scale-105'
            }`}
          >
            {getTabIcon(tab)}
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {active === 'Portfólio' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {portfolio.length > 0 ? (
              <div className="grid gap-6">
                {portfolio.map((item) => (
                  <PortfolioCard 
                    key={item._id} 
                    post={item} 
                    isOwner={isOwner} 
                    onUnpin={handleUnpin}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[40px] bg-if-card/50 p-16 text-center border-2 border-dashed border-white/5">
                <div className="bg-if-purple/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-if-purple">
                  <Briefcase size={40} />
                </div>
                <h4 className="text-xl font-black text-if-text mb-2">Seu Portfólio Acadêmico</h4>
                <p className="max-w-md mx-auto text-if-text/50 font-medium italic leading-relaxed">
                  {isOwner 
                    ? "Seu portfólio está vazio. Fixe seus 3 melhores projetos aqui para se destacar para recrutadores!" 
                    : "Este acadêmico ainda não organizou seu portfólio de destaques."}
                </p>
              </div>
            )}
            
            {/* Lista regular abaixo do portfólio para facilitar a fixação */}
            {isOwner && (
              <div className="mt-12 pt-12 border-t border-white/5">
                <h3 className="text-xl font-black text-if-purple mb-6 uppercase tracking-tighter">Sua Produção (Para Fixar)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="flex flex-col gap-6">
                    {posts.filter((_, i) => i % 2 === 0).map((post) => (
                      <PostCard 
                        key={post._id} 
                        post={post} 
                        isOwner={isOwner} 
                        isPinned={portfolio.some(p => p._id === post._id)}
                        onPin={(pos) => handlePin(post._id, pos)}
                        onDelete={onPostDelete}
                      />
                    ))}
                  </div>
                  <div className="flex flex-col gap-6">
                    {posts.filter((_, i) => i % 2 !== 0).map((post) => (
                      <PostCard 
                        key={post._id} 
                        post={post} 
                        isOwner={isOwner} 
                        isPinned={portfolio.some(p => p._id === post._id)}
                        onPin={(pos) => handlePin(post._id, pos)}
                        onDelete={onPostDelete}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : active === 'Salvos' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
            {loadingSaved ? (
              <div className="col-span-full py-10 text-center text-if-text/50 font-medium">
                Carregando postagens salvas...
              </div>
            ) : displayedSavedPosts.length > 0 ? (
              <>
                <div className="flex flex-col gap-6">
                  {displayedSavedPosts.filter((_, i) => i % 2 === 0).map((post) => (
                    <PostCard 
                      key={post._id} 
                      post={post} 
                      isOwner={isOwner}
                      isPinned={portfolio.some(p => p._id === post._id)}
                      onPin={(pos) => handlePin(post._id, pos)}
                      onDelete={onPostDelete}
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-6">
                  {displayedSavedPosts.filter((_, i) => i % 2 !== 0).map((post) => (
                    <PostCard 
                      key={post._id} 
                      post={post} 
                      isOwner={isOwner}
                      isPinned={portfolio.some(p => p._id === post._id)}
                      onPin={(pos) => handlePin(post._id, pos)}
                      onDelete={onPostDelete}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="col-span-full rounded-[40px] bg-if-card/50 p-20 text-center text-if-text/50 font-medium italic border-2 border-dashed border-white/5">
                Nenhuma postagem salva ainda. Salve postagens interessantes no seu feed para ler depois!
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
            {filteredPosts.length > 0 ? (
              <>
                <div className="flex flex-col gap-6">
                  {filteredPosts.filter((_, i) => i % 2 === 0).map((post) => (
                    <PostCard 
                      key={post._id} 
                      post={post} 
                      isOwner={isOwner}
                      isPinned={portfolio.some(p => p._id === post._id)}
                      onPin={(pos) => handlePin(post._id, pos)}
                      onDelete={onPostDelete}
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-6">
                  {filteredPosts.filter((_, i) => i % 2 !== 0).map((post) => (
                    <PostCard 
                      key={post._id} 
                      post={post} 
                      isOwner={isOwner}
                      isPinned={portfolio.some(p => p._id === post._id)}
                      onPin={(pos) => handlePin(post._id, pos)}
                      onDelete={onPostDelete}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="col-span-full rounded-[40px] bg-if-card/50 p-20 text-center text-if-text/50 font-medium italic border-2 border-dashed border-white/5">
                Nenhuma postagem encontrada nesta categoria.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
