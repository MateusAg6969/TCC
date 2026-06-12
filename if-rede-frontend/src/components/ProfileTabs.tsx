'use client';

import { useMemo, useState } from 'react';
import type { Post } from '@/types';
import PostCard from './PostCard';

const tabs = ['Postagens', 'Msc', 'Text', 'Img'] as const;
type Tab = (typeof tabs)[number];

export default function ProfileTabs({ 
  posts, 
  userId 
}: { 
  posts: Post[]; 
  userId: string;
}) {
  const [active, setActive] = useState<Tab>('Postagens');

  const filteredPosts = useMemo(() => {
    if (active === 'Postagens') return posts;
    if (active === 'Msc') return posts.filter((p) => p.tipo === 'audio' || p.tipo === 'msc');
    if (active === 'Text') return posts.filter((p) => p.tipo === 'texto');
    if (active === 'Img') return posts.filter((p) => p.tipo === 'imagem');
    return [];
  }, [active, posts]);

  return (
    <section>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/5 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
              active === tab 
                ? 'bg-if-purple text-white shadow-lg shadow-if-purple/20' 
                : 'bg-if-card text-if-text/60 hover:bg-white/5 hover:text-if-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredPosts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
        {!filteredPosts.length && (
          <div className="col-span-full rounded-main bg-if-card/50 p-12 text-center text-if-text/50 font-medium italic border-2 border-dashed border-white/5">
            O silêncio é uma tela em branco. Nenhuma postagem encontrada.
          </div>
        )}
      </div>
    </section>
  );
}
