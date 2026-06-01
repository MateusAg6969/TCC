/**
 * Hook useUsuario
 * 
 * Gerencia dados do usuário autenticado e de outros perfis.
 * Cache e sincronização com API.
 * 
 * Funções:
 * - Obter dados do usuário autenticado
 * - Obter perfil de outro usuário
 * - Atualizar perfil
 * - Atualizar foto
 * - Atualizar customização
 * 
 * Uso: const { usuarioAtual, obterPerfil, atualizarPerfil, ... } = useUsuario();
 */

import { useCallback, useState } from 'react';
import usuarioService from '@/lib/services/usuarioService';
import type { Usuario, CustomizacaoCompleta } from '@/types';

interface UseUsuarioReturn {
  // Estado
  usuarioAtual: Usuario | null;
  usuariosCache: Map<string, Usuario>;
  loading: boolean;
  error: string | null;

  // Ações
  carregarMeuPerfil: () => Promise<void>;
  obterPerfil: (usuarioId: string) => Promise<Usuario | null>;
  atualizarPerfil: (dados: {
    nome?: string;
    bio?: string;
    privacidade?: 'publico' | 'privado';
  }) => Promise<void>;
  atualizarFoto: (file: File) => Promise<void>;
  atualizarCustomizacao: (
    customizacao: Partial<CustomizacaoCompleta>
  ) => Promise<void>;
  limpar: () => void;
}

export function useUsuario(): UseUsuarioReturn {
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [usuariosCache, setUsuariosCache] = useState<Map<string, Usuario>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarMeuPerfil = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dados = await usuarioService.obterMeuPerfil();
      setUsuarioAtual(dados);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar perfil';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const obterPerfil = useCallback(
    async (usuarioId: string): Promise<Usuario | null> => {
      // Verificar cache primeiro
      const cached = usuariosCache.get(usuarioId);
      if (cached) {
        return cached;
      }

      setLoading(true);
      setError(null);

      try {
        const dados = await usuarioService.obterPerfil(usuarioId);
        // Atualizar cache
        setUsuariosCache((prev) => {
          const novo = new Map(prev);
          novo.set(usuarioId, dados);
          return novo;
        });
        return dados;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao obter perfil';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [usuariosCache]
  );

  const atualizarPerfil = useCallback(
    async (dados: {
      nome?: string;
      bio?: string;
      privacidade?: 'publico' | 'privado';
    }) => {
      setLoading(true);
      setError(null);

      try {
        const usuarioAtualizado = await usuarioService.atualizarPerfil(dados);
        setUsuarioAtual(usuarioAtualizado);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const atualizarFoto = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const usuarioAtualizado = await usuarioService.atualizarFoto(file);
      setUsuarioAtual(usuarioAtualizado);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar foto';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const atualizarCustomizacao = useCallback(
    async (customizacao: Partial<CustomizacaoCompleta>) => {
      setLoading(true);
      setError(null);

      try {
        const customizacaoAtualizada =
          await usuarioService.atualizarCustomizacao(customizacao);

        // Atualizar customização do usuário atual
        setUsuarioAtual((prev) =>
          prev
            ? {
                ...prev,
                customizacao: customizacaoAtualizada as any,
              }
            : null
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao atualizar customização';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const limpar = useCallback(() => {
    setUsuarioAtual(null);
    setUsuariosCache(new Map());
    setError(null);
  }, []);

  return {
    usuarioAtual,
    usuariosCache,
    loading,
    error,
    carregarMeuPerfil,
    obterPerfil,
    atualizarPerfil,
    atualizarFoto,
    atualizarCustomizacao,
    limpar,
  };
}
