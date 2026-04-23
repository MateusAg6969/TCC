'use client';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import api, { setAuthHeader } from '@/lib/api';

type AuthUser = {
  id: string;
  nome: string;
  email: string;
  status_vinculo: string;
  mod_voluntario?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  register: (payload: {
    nome: string;
    email: string;
    matricula: string;
    senha: string;
    status_vinculo?: string;
  }) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_COOKIE = 'ifrede_token';
const REFRESH_COOKIE = 'ifrede_refresh';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => Cookies.get(ACCESS_COOKIE) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const savedToken = Cookies.get(ACCESS_COOKIE) || null;

      if (!savedToken) {
        if (active) setLoading(false);
        return;
      }

      setAuthHeader(savedToken);

      try {
        const res = await api.get('/usuarios/me', {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        const data = res.data?.data;
        if (!active || !data) return;

        setToken(savedToken);
        setUser({
          id: data.id,
          nome: data.perfil?.nome,
          email: data.perfil?.email,
          status_vinculo: data.perfil?.status_vinculo,
          // Este campo e usado para liberar UI de moderacao (filtro de palavras).
          // Entrada: resposta de /usuarios/me contendo configuracoes do usuario.
          // Saida: estado de sessao no contexto de autenticacao.
          mod_voluntario: Boolean(data.configuracoes?.mod_voluntario),
        });
      } catch {
        if (!active) return;
        Cookies.remove(ACCESS_COOKIE);
        Cookies.remove(REFRESH_COOKIE);
        setAuthHeader(undefined);
        setToken(null);
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, senha: string) => {
    const response = await api.post('/auth/login', { email, senha });
    const data = response.data?.data;
    const accessToken = data?.tokens?.accessToken;
    const refreshToken = data?.tokens?.refreshToken;

    if (!accessToken || !data?.usuario) {
      throw new Error('Resposta de login inválida.');
    }

    Cookies.set(ACCESS_COOKIE, accessToken, { expires: 1 });
    Cookies.set(REFRESH_COOKIE, refreshToken, { expires: 7 });

    setAuthHeader(accessToken);
    setToken(accessToken);
    setUser(data.usuario);
    router.push('/home');
  };

  const register = async (payload: {
    nome: string;
    email: string;
    matricula: string;
    senha: string;
    status_vinculo?: string;
  }) => {
    const response = await api.post('/auth/register', payload);
    const data = response.data?.data;
    const accessToken = data?.tokens?.accessToken;
    const refreshToken = data?.tokens?.refreshToken;

    if (!accessToken || !data?.usuario) {
      throw new Error('Resposta de cadastro inválida.');
    }

    Cookies.set(ACCESS_COOKIE, accessToken, { expires: 1 });
    Cookies.set(REFRESH_COOKIE, refreshToken, { expires: 7 });

    setAuthHeader(accessToken);
    setToken(accessToken);
    setUser(data.usuario);
    router.push('/home');
  };

  const logout = () => {
    Cookies.remove(ACCESS_COOKIE);
    Cookies.remove(REFRESH_COOKIE);
    setAuthHeader(undefined);
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const value = useMemo(
    () => ({ user, token, login, register, logout, loading }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return context;
}
