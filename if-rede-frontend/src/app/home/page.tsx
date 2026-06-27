import HomeFeedClient from '@/components/HomeFeedClient';
import { serverGet } from '@/lib/server-api';
import type { ApiSuccess, Post } from '@/types';

async function getFeed() {
  const response = await serverGet<ApiSuccess<Post[]>>('/postagens/feed?page=1&limit=12');
  return response?.data || [];
}

async function getDestaques() {
  const response = await serverGet<ApiSuccess<Post[]>>('/postagens/destaques');
  return response?.data || [];
}

type MePayload = {
  id: string;
};

async function getMe() {
  const response = await serverGet<ApiSuccess<MePayload>>('/usuarios/me');
  return response?.data || null;
}

export default async function HomePage() {
  const [feed, destaques, me] = await Promise.all([getFeed(), getDestaques(), getMe()]);
  const profileHref = me?.id ? `/profile/${me.id}` : '/home';

  return <HomeFeedClient feed={feed} destaques={destaques} profileHref={profileHref} />;
}
