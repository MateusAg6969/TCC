import axios from 'axios';

// O que faz: define endpoint base da API para todas as chamadas no client.
// Por que: no fluxo local atual o frontend roda na 3000 e o backend na 3001;
// apontar para 3000 aqui faria chamadas cairem no proprio Next (404 em /auth/login).
// Fluxo de dados: chamadas axios -> baseURL -> backend Express na porta correta.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 12000,
});

export function setAuthHeader(token?: string) {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export default api;
