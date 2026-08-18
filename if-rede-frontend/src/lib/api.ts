import axios from 'axios';
import Cookies from 'js-cookie';

// O que faz: define endpoint base da API para todas as chamadas no client.
// Por que: no fluxo local atual o frontend roda na 3000 e o backend na 3001;
// apontar para 3000 aqui faria chamadas cairem no proprio Next (404 em /auth/login).
// Fluxo de dados: chamadas axios -> baseURL -> backend Express na porta correta.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 12000,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o backend retornar status 503 e código de manutenção, redireciona o usuário comum para a página de manutenção
    if (
      error.response?.status === 503 &&
      error.response?.data?.error?.code === 'MAINTENANCE_MODE'
    ) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/manutencao')) {
        window.location.href = '/manutencao';
      }
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      originalRequest._retry = true;

      try {
        // Tenta renovar o token chamando /auth/refresh (o cookie HttpOnly será enviado automaticamente se presente)
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken: newAccess } = response.data?.data?.tokens || {};

        if (newAccess) {
          const isRemember = Cookies.get('ifrede_remember') === 'true';
          const cookieOptions = isRemember ? { expires: 30, path: '/' } : { path: '/' };

          Cookies.set('ifrede_token', newAccess, cookieOptions);

          setAuthHeader(newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        Cookies.remove('ifrede_token');
        Cookies.remove('ifrede_refresh');
        Cookies.remove('ifrede_remember');
        setAuthHeader(undefined);
        if (typeof window !== 'undefined') {
          const publicPaths = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
          const isPublic = publicPaths.some(p => window.location.pathname.startsWith(p));
          if (!isPublic) {
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Resolve a URL de um asset (imagem, áudio, etc) do backend.
 * O que faz: Converte caminhos relativos em URLs absolutas usando a base da API.
 */
export function resolveAssetUrl(url?: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function setAuthHeader(token?: string) {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export default api;
