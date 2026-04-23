import { cookies } from 'next/headers';

// O que faz: define endpoint base da API para fetches server-side (RSC).
// Por que: no ambiente local, o backend roda na 3000 enquanto o Next ocupa 3001.
// Sem isso, o server fetch tentaria o proprio Next em vez da API Express.
// Fluxo: server component -> serverGet -> fetch(API_URL + path) -> resposta JSON.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function serverGet<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ifrede_token')?.value;

    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
