'use client';

import { useMemo, useState } from 'react';
import type { Post } from '@/types';
import PostCard from './PostCard';

const tabs = ['Fans', 'Msc', 'Text', 'Img'] as const;
type Tab = (typeof tabs)[number];

export default function ProfileTabs({ posts }: { posts: Post[] }) {
  const [active, setActive] = useState<Tab>('Fans');

  const filtered = useMemo(() => {
    if (active === 'Fans') return posts;
    if (active === 'Msc') return posts.filter((p) => p.tipo === 'audio' || p.tipo === 'msc');
    if (active === 'Text') return posts.filter((p) => p.tipo === 'texto');
    if (active === 'Img') return posts.filter((p) => p.tipo === 'imagem');
    return posts;
  }, [active, posts]);

  return (
    <section>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              active === tab ? 'bg-if-olive text-if-bg' : 'bg-if-card text-if-text/85 hover:text-if-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
        {!filtered.length && (
          <div className="rounded-main bg-if-card p-6 text-if-text/75">Nenhuma postagem nesta aba.</div>
        )}
      </div>
    </section>
  );
}
