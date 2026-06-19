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
import { useNotifications } from '@/context/NotificationContext';

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
  // Nota: o useNotifications será chamado mais abaixo no componente que o consome, 
  // mas aqui dentro do AuthProvider causará um erro se o NotificationProvider estiver dentro do AuthProvider.
  // Como o usuário pediu para colocar aqui, vamos adicionar a função chamando de forma segura.
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

  // Lógica de Login: Realiza a autenticação e persiste a sessão.
  // Entrada: email e senha digitados no formulário.
  // Fluxo: Chamada API -> Extração de Tokens -> Gravação de Cookies -> Atualização de Estado -> Redirecionamento.
  const login = async (email: string, senha: string) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      
      // O que faz: Extrai os dados da resposta padronizada { ok: true, data: { ... } }
      const { data } = response.data;
      const accessToken = data?.tokens?.accessToken;
      const refreshToken = data?.tokens?.refreshToken;
      const usuarioLogado = data?.usuario;

      if (!accessToken || !usuarioLogado) {
        throw new Error('Resposta de login inválida: Tokens ou dados do usuário ausentes.');
      }

      // 1. Persistência Física: Grava os tokens nos Cookies para serem lidos pelo Middleware (SSR).
      // Por que: Permite que o Next.js proteja rotas no lado do servidor.
      Cookies.set(ACCESS_COOKIE, accessToken, { expires: 1, path: '/' }); // 1 dia
      Cookies.set(REFRESH_COOKIE, refreshToken, { expires: 7, path: '/' }); // 7 dias

      // 2. Configuração de Rede: Aplica o token nas requisições futuras do Axios.
      setAuthHeader(accessToken);
      
      // 3. Persistência em Memória: Atualiza o estado global do React.
      setToken(accessToken);
      setUser(usuarioLogado);

      // 4. Fluxo de Navegação: Leva o usuário para a área restrita.
      router.push('/home');
    } catch (error: any) {
      console.error('Falha na autenticação via AuthContext:', error);
      throw error;
    }
  };

  const register = async (payload: {
    nome: string;
    email: string;
    senha: string;
    status_vinculo?: string;
  }) => {
    await api.post('/auth/register', payload);
    // O redirecionamento e a mensagem de sucesso agora são tratados pelo componente da página
  };

  const logout = async () => {
    try {
      const refreshToken = Cookies.get(REFRESH_COOKIE);
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
    } finally {
      Cookies.remove(ACCESS_COOKIE);
      Cookies.remove(REFRESH_COOKIE);
      setAuthHeader(undefined);
      setToken(null);
      setUser(null);
      router.push('/login');
    }
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
