'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Notificacao } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { io, Socket } from 'socket.io-client';

interface NotificationContextType {
  notificacoes: Notificacao[];
  naoLidas: number;
  carregando: boolean;
  erro: string | null;
  ultimasNotificacaoRecebida: Notificacao | null;
  socket: Socket | null;
  buscarNotificacoes: (pagina?: number, filtro?: string) => Promise<void>;
  marcarComoLida: (id: string) => Promise<void>;
  marcarTudasComoLidas: () => Promise<void>;
  deletarNotificacao: (id: string) => Promise<void>;
  deletarTodasNotificacoes: () => Promise<void>;
  contarNaoLidas: () => Promise<void>;
  lidarComCliqueNotificacao: (notificacao: Notificacao) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimasNotificacaoRecebida, setUltimasNotificacaoRecebida] = useState<Notificacao | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Buscar notificações
  const buscarNotificacoes = useCallback(async (pagina = 1, filtro = 'all') => {
    if (!token) return;

    try {
      setCarregando(true);
      setErro(null);

      const response = await axios.get(`${API_URL}/notificacoes`, {
        params: { pagina, limite: 20, filtro },
        headers: { Authorization: `Bearer ${token}` },
      });

      // Adaptar para a estrutura real da API se necessário (o arquivo original usava response.data.sucesso)
      const data = response.data;
      if (data.ok || data.sucesso) {
        setNotificacoes(data.data || data.dados || []);
        setNaoLidas(data.meta?.total_nao_lidas || data.nao_lidas || 0);
      }
    } catch (err: any) {
      console.error('Erro ao buscar notificações:', err);
      setErro(err.response?.data?.message || err.response?.data?.mensagem || 'Erro ao buscar notificações');
    } finally {
      setCarregando(false);
    }
  }, [token, API_URL]);

  // Contar não lidas
  const contarNaoLidas = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/notificacoes/nao-lidas/contador`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      if (data.ok || data.sucesso) {
        setNaoLidas(data.data?.total || data.nao_lidas || 0);
      }
    } catch (err) {
      console.error('Erro ao contar não lidas:', err);
    }
  }, [token, API_URL]);

  // Gerenciamento de Socket.io em Tempo Real
  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Inicialização da Conexão Persistente
    // O que faz: Conecta ao backend passando o token para o handshake de segurança.
    const socket = io(API_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Conectado ao servidor de notificações (Socket.io)');
    });

    // Ouvinte de Eventos: Nova Notificação
    // O que faz: Recebe o payload e atualiza o estado local imediatamente.
    socket.on('notificacao:nova', (novaNotificacao: Notificacao) => {
      console.log('🔔 Nova notificação recebida em tempo real:', novaNotificacao);
      
      setNotificacoes(prev => [novaNotificacao, ...prev]);
      setNaoLidas(prev => prev + 1);
      
      // Gatilho para animação no sino
      setUltimasNotificacaoRecebida(novaNotificacao);
      setTimeout(() => setUltimasNotificacaoRecebida(null), 3000);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Erro na conexão do Socket:', err.message);
    });

    // Cleanup: Encerra a conexão ao desmontar ou fazer logout
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user, API_URL]);

  // Marcar como lida
  const marcarComoLida = useCallback(
    async (notificacaoId: string) => {
      if (!token) return;

      try {
        const response = await axios.patch(
          `${API_URL}/notificacoes/${notificacaoId}/lida`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.ok || response.data.sucesso) {
          setNotificacoes((prev) =>
            prev.map((n) =>
              n._id === notificacaoId ? { ...n, lida: true } : n
            )
          );
          setNaoLidas((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error('Erro ao marcar notificação como lida:', err);
        toast.error('Erro ao atualizar notificação.');
      }
    },
    [token, API_URL]
  );

  const marcarTudasComoLidas = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.patch(`${API_URL}/notificacoes/marcar-tudo-lido`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.ok || response.data.sucesso) {
        setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
        setNaoLidas(0);
      }
    } catch (err) {
      console.error('Erro ao marcar todas as notificações como lidas:', err);
      toast.error('Erro ao limpar notificações.');
    }
  }, [token, API_URL]);

  // Deletar notificação
  const deletarNotificacao = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const response = await axios.delete(`${API_URL}/notificacoes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.ok || response.data.sucesso) {
        setNotificacoes(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      console.error('Erro ao deletar notificação:', err);
      toast.error('Não foi possível excluir a notificação.');
    }
  }, [token, API_URL]);

  const deletarTodasNotificacoes = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.delete(`${API_URL}/notificacoes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.ok || response.data.sucesso) {
        setNotificacoes([]);
        setNaoLidas(0);
      }
    } catch (err) {
      console.error('Erro ao deletar todas as notificações:', err);
      toast.error('Erro ao excluir todas as notificações.');
    }
  }, [token, API_URL]);

  const lidarComCliqueNotificacao = useCallback((notificacao: Notificacao) => {
    if (!notificacao.lida) {
      marcarComoLida(notificacao._id);
    }

    switch (notificacao.tipo) {
      case 'like':
      case 'comentario':
      case 'repost':
      case 'tag':
      case 'resposta':
        if (notificacao.objeto_id) {
          router.push(`/post/${notificacao.objeto_id}`);
        }
        break;
      case 'seguidor':
        if (notificacao.ator_id?._id) {
          router.push(`/profile/${notificacao.ator_id._id}`);
        }
        break;
      default:
        break;
    }
  }, [marcarComoLida, router]);

  useEffect(() => {
    if (token) {
      buscarNotificacoes();
    }
  }, [token, buscarNotificacoes]);

  const value = {
    notificacoes,
    naoLidas,
    carregando,
    erro,
    ultimasNotificacaoRecebida,
    socket: socketRef.current,
    buscarNotificacoes,
    marcarComoLida,
    marcarTudasComoLidas,
    deletarNotificacao,
    deletarTodasNotificacoes,
    contarNaoLidas,
    lidarComCliqueNotificacao,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
