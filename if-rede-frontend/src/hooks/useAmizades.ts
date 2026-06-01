/**
 * Hook useAmizades
 * 
 * Gerencia estado e cache de amizades do usuário.
 * Realiza chamadas ao amizadeService e mantém dados em cache.
 * 
 * Funções:
 * - Listar amigos com paginação
 * - Listar solicitações pendentes
 * - Enviar/aceitar/recusar solicitação
 * - Desfazer amizade
 * - Verificar status de amizade
 * - Cache inteligente para evitar requisições repetidas
 * 
 * Uso: const { amigos, solicitacoes, enviarSolicitacao, ... } = useAmizades();
 */

import { useCallback, useEffect, useState } from 'react';
import amizadeService from '@/lib/services/amizadeService';
import type { Usuario, SolicitacaoAmizade, Amizade, StatusAmizade } from '@/types';

interface PaginacaoState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseAmizadesReturn {
  // Estado
  amigos: Usuario[];
  solicitacoes: SolicitacaoAmizade[];
  paginacao: PaginacaoState;
  loading: boolean;
  error: string | null;

  // Ações
  carregarAmigos: (usuarioId: string, pagina?: number) => Promise<void>;
  carregarSolicitacoes: () => Promise<void>;
  enviarSolicitacao: (usuarioId: string) => Promise<void>;
  aceitarSolicitacao: (amizadeId: string) => Promise<void>;
  recusarSolicitacao: (amizadeId: string) => Promise<void>;
  desfazerAmizade: (amizadeId: string) => Promise<void>;
  verificarStatus: (usuarioId: string) => Promise<StatusAmizade | null>;
  limpar: () => void;
}

export function useAmizades(): UseAmizadesReturn {
  const [amigos, setAmigos] = useState<Usuario[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAmizade[]>([]);
  const [paginacao, setPaginacao] = useState<PaginacaoState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache para evitar requisições repetidas
  const [cacheAmigos, setCacheAmigos] = useState<Map<string, Usuario[]>>(
    new Map()
  );
  const [cacheSolicitacoes, setCacheSolicitacoes] = useState<boolean>(false);

  const carregarAmigos = useCallback(
    async (usuarioId: string, pagina: number = 1) => {
      setLoading(true);
      setError(null);

      try {
        const cached = cacheAmigos.get(`${usuarioId}:${pagina}`);
        if (cached) {
          setAmigos(cached);
          return;
        }

        const { amigos: dados, paginacao: pag } =
          await amizadeService.listarAmigos(usuarioId, pagina);

        setAmigos(dados);
        setPaginacao(pag);

        // Atualizar cache
        setCacheAmigos((prev) => {
          const novo = new Map(prev);
          novo.set(`${usuarioId}:${pagina}`, dados);
          return novo;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao carregar amigos';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [cacheAmigos]
  );

  const carregarSolicitacoes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Cache de 1 minuto para solicitações
      if (cacheSolicitacoes) {
        return;
      }

      const dados = await amizadeService.listarSolicitacoes();
      setSolicitacoes(dados);
      setCacheSolicitacoes(true);

      // Limpar cache após 1 minuto
      setTimeout(() => setCacheSolicitacoes(false), 60000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar solicitações';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [cacheSolicitacoes]);

  const enviarSolicitacao = useCallback(async (usuarioId: string) => {
    setLoading(true);
    setError(null);

    try {
      await amizadeService.enviarSolicitacao(usuarioId);
      // Limpar cache de solicitações
      setCacheSolicitacoes(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar solicitação';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const aceitarSolicitacao = useCallback(async (amizadeId: string) => {
    setLoading(true);
    setError(null);

    try {
      await amizadeService.aceitarSolicitacao(amizadeId);
      // Remover solicitação da lista
      setSolicitacoes((prev) =>
        prev.filter((s) => s._id !== amizadeId)
      );
      // Limpar cache de amigos
      setCacheAmigos(new Map());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao aceitar solicitação';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const recusarSolicitacao = useCallback(async (amizadeId: string) => {
    setLoading(true);
    setError(null);

    try {
      await amizadeService.recusarSolicitacao(amizadeId);
      // Remover solicitação da lista
      setSolicitacoes((prev) =>
        prev.filter((s) => s._id !== amizadeId)
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao recusar solicitação';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const desfazerAmizade = useCallback(async (amizadeId: string) => {
    setLoading(true);
    setError(null);

    try {
      await amizadeService.desfazerAmizade(amizadeId);
      // Atualizar lista de amigos
      setAmigos((prev) =>
        prev.filter((a) => a.id !== amizadeId && a._id !== amizadeId)
      );
      // Limpar cache
      setCacheAmigos(new Map());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao desfazer amizade';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verificarStatus = useCallback(
    async (usuarioId: string): Promise<StatusAmizade | null> => {
      try {
        const status = await amizadeService.verificarAmizade(usuarioId);
        return status as StatusAmizade;
      } catch (err) {
        return null;
      }
    },
    []
  );

  const limpar = useCallback(() => {
    setAmigos([]);
    setSolicitacoes([]);
    setError(null);
    setCacheAmigos(new Map());
    setCacheSolicitacoes(false);
  }, []);

  return {
    amigos,
    solicitacoes,
    paginacao,
    loading,
    error,
    carregarAmigos,
    carregarSolicitacoes,
    enviarSolicitacao,
    aceitarSolicitacao,
    recusarSolicitacao,
    desfazerAmizade,
    verificarStatus,
    limpar,
  };
}
