/**
 * Hook useBuscador
 * 
 * Gerencia busca de usuários com debounce.
 * Evita chamadas excessivas à API durante digitação.
 * 
 * Features:
 * - Debounce configurável
 * - Limpeza automática quando termo vazio
 * - Cache de buscas
 * - Cancelamento de requisições anteriores
 * 
 * Uso: const { resultados, buscar, loading } = useBuscador();
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import usuarioService from '@/lib/services/usuarioService';
import type { Usuario } from '@/types';

interface UseBuscadorReturn {
  // Estado
  resultados: Usuario[];
  termo: string;
  loading: boolean;
  error: string | null;

  // Ações
  buscar: (termo: string) => void;
  limpar: () => void;
}

const DEBOUNCE_DELAY = 500; // 500ms
const CACHE_BUSCA = new Map<string, Usuario[]>();

export function useBuscador(
  delayMs: number = DEBOUNCE_DELAY,
  limite: number = 10
): UseBuscadorReturn {
  const [resultados, setResultados] = useState<Usuario[]>([]);
  const [termo, setTermo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref para timer de debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Ref para cancelar requisições anteriores
  const abortControllerRef = useRef<AbortController | null>(null);

  const executarBusca = useCallback(
    async (termoAtual: string) => {
      // Se termo vazio, limpar
      if (!termoAtual.trim()) {
        setResultados([]);
        setError(null);
        return;
      }

      // Verificar cache
      const cached = CACHE_BUSCA.get(termoAtual);
      if (cached) {
        setResultados(cached);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const dados = await usuarioService.buscarUsuarios(termoAtual, limite);
        setResultados(dados);

        // Armazenar em cache
        CACHE_BUSCA.set(termoAtual, dados);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro na busca';
        setError(msg);
        setResultados([]);
      } finally {
        setLoading(false);
      }
    },
    [limite]
  );

  const buscar = useCallback(
    (novoTermo: string) => {
      setTermo(novoTermo);

      // Limpar timer anterior
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Se termo vazio, limpar imediatamente
      if (!novoTermo.trim()) {
        setResultados([]);
        setError(null);
        return;
      }

      // Definir novo timer com debounce
      debounceTimerRef.current = setTimeout(() => {
        executarBusca(novoTermo);
      }, delayMs);
    },
    [delayMs, executarBusca]
  );

  const limpar = useCallback(() => {
    setTermo('');
    setResultados([]);
    setError(null);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    resultados,
    termo,
    loading,
    error,
    buscar,
    limpar,
  };
}
