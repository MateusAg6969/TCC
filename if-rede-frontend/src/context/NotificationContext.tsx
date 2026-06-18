'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Notificacao } from '@/types';
import { toast } from 'sonner';

interface NotificationContextType {
  notificacoes: Notificacao[];
  naoLidas: number;
  carregando: boolean;
  erro: string | null;
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
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  // Buscar token ao montar
  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setToken(t);
  }, []);

  // Buscar notificações
  const buscarNotificacoes = useCallback(async (pagina = 1, filtro = 'all') => {
    if (!token) return;

    try {
      setCarregando(true);
      setErro(null);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/notificacoes`,
        {
          params: { pagina, limite: 20, filtro },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.sucesso) {
        setNotificacoes(response.data.dados);
        setNaoLidas(response.data.nao_lidas);
      }
    } catch (err: any) {
      console.error('Erro ao buscar notificações:', err);
      const mensagem = err.response?.data?.mensagem || 'Erro ao buscar notificações';
      setErro(mensagem);
      // Opcional: toast.error(mensagem); // Removido para evitar spam em polling
    } finally {
      setCarregando(false);
    }
  }, [token]);

  // Marcar como lida
  const marcarComoLida = useCallback(
    async (notificacaoId: string) => {
      if (!token) return;

      try {
        const response = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/notificacoes/${notificacaoId}/lida`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.sucesso) {
          // Atualizar notificações localmente
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
    [token]
  );

  // Marcar todas como lidas
  const marcarTudasComoLidas = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/notificacoes/marcar-tudo-lido`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.sucesso) {
        setNotificacoes((prev) =>
          prev.map((n) => ({ ...n, lida: true }))
        );
        setNaoLidas(0);
      }
    } catch (err) {
      console.error('Erro ao marcar todas as notificações como lidas:', err);
      toast.error('Erro ao limpar notificações.');
    }
  }, [token]);

  // Deletar notificação
  const deletarNotificacao = useCallback(
    async (notificacaoId: string) => {
      if (!token) return;

      try {
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/notificacoes/${notificacaoId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.sucesso) {
          setNotificacoes((prev) => prev.filter((n) => n._id !== notificacaoId));
        }
      } catch (err) {
        console.error('Erro ao deletar notificação:', err);
        toast.error('Não foi possível excluir a notificação.');
      }
    },
    [token]
  );

  // Deletar todas
  const deletarTodasNotificacoes = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/notificacoes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.sucesso) {
        setNotificacoes([]);
        setNaoLidas(0);
      }
    } catch (err) {
      console.error('Erro ao deletar todas as notificações:', err);
      toast.error('Erro ao excluir todas as notificações.');
    }
  }, [token]);

  // Contar não lidas
  const contarNaoLidas = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/notificacoes/nao-lidas/contador`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.sucesso) {
        setNaoLidas(response.data.nao_lidas);
      }
    } catch (err) {
      console.error('Erro ao contar não lidas:', err);
    }
  }, [token]);

  // Lógica de redirecionamento baseada no tipo de notificação
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

  // Polling: buscar a cada 30 segundos
  useEffect(() => {
    if (!token) return;

    // Buscar imediatamente
    buscarNotificacoes();

    // Configurar polling
    const intervalo = setInterval(() => {
      contarNaoLidas();
    }, 30000); // 30 segundos

    return () => clearInterval(intervalo);
  }, [token, buscarNotificacoes, contarNaoLidas]);

  const value = {
    notificacoes,
    naoLidas,
    carregando,
    erro,
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
