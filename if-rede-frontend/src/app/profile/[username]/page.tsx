import ProfileClient from '@/components/ProfileClient';
import { serverGet } from '@/lib/server-api';
import type { ApiSuccess, Post, Medalha, PortfolioItem } from '@/types';

type ProfilePayload = {
  id: string;
  perfil: {
    nome: string;
    apelido?: string;
    bio?: string;
    privacidade?: string;
    status_vinculo?: string;
    curso?: string;
    ano?: string;
  };
  customizacao?: {
    cor_fundo?: string;
    cor_botoes?: string;
    avatar_url?: string;
    banner_url?: string;
    medalhas?: Medalha[];
    portfolio?: PortfolioItem[];
  };
  stats?: {
    total_seguidores?: number;
    total_postagens?: number;
  };
};

async function getProfile(username: string) {
  const res = await serverGet<ApiSuccess<ProfilePayload>>(`/usuarios/${username}`);
  return res?.data || null;
}

async function getUserPosts(username: string) {
  const res = await serverGet<ApiSuccess<Post[]>>(`/postagens/usuario/${username}?page=1&limit=20`);
  return res?.data || [];
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const [profile, posts] = await Promise.all([getProfile(username), getUserPosts(username)]);

  return <ProfileClient username={username} profile={profile} posts={posts} />;
}
