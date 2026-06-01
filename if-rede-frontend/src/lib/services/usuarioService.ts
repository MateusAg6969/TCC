/**
 * Service de Usuários
 * 
 * Responsável por:
 * - Obter dados de perfil (próprio e de outros)
 * - Atualizar perfil
 * - Atualizar customizações
 * - Buscar usuários
 * 
 * Fluxo: Component -> Hook useUsuario -> usuarioService -> API Backend
 */

import api from '@/lib/api';
import type { Usuario, Customizacao, ApiSuccess, ApiError, CustomizacaoCompleta } from '@/types';

type ApiResponse<T> = ApiSuccess<T> | ApiError;

export const usuarioService = {
  /**
   * Obtém o perfil do usuário autenticado
   * GET /usuarios/me
   */
  async obterMeuPerfil(): Promise<Usuario> {
    try {
      const res = await api.get<ApiResponse<Usuario>>('/usuarios/me');

      if (!res.data.ok) {
        throw new Error(res.data.error.message);
      }

      return res.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Obtém o perfil de um usuário por ID
   * GET /usuarios/:id
   */
  async obterPerfil(usuarioId: string): Promise<Usuario> {
    try {
      const res = await api.get<ApiResponse<Usuario>>(
        `/usuarios/${usuarioId}`
      );

      if (!res.data.ok) {
        throw new Error(res.data.error.message);
      }

      return res.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Atualiza dados do perfil do usuário autenticado
   * PUT /usuarios/perfil
   */
  async atualizarPerfil(dados: {
    nome?: string;
    bio?: string;
    privacidade?: 'publico' | 'privado';
  }): Promise<Usuario> {
    try {
      const res = await api.put<ApiResponse<Usuario>>(
        '/usuarios/perfil',
        dados
      );

      if (!res.data.ok) {
        throw new Error(res.data.error.message);
      }

      return res.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Atualiza foto/avatar do perfil
   * POST /usuarios/perfil/foto
   * Requer FormData com campo 'avatar'
   */
  async atualizarFoto(file: File): Promise<Usuario> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.post<ApiResponse<Usuario>>(
        '/usuarios/perfil/foto',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!res.data.ok) {
        throw new Error(res.data.error.message);
      }

      return res.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Atualiza customizações visuais do perfil
   * PUT /usuarios/customizacao
   */
  async atualizarCustomizacao(
    customizacao: Partial<CustomizacaoCompleta>
  ): Promise<CustomizacaoCompleta> {
    try {
      const res = await api.put<ApiResponse<CustomizacaoCompleta>>(
        '/usuarios/customizacao',
        customizacao
      );

      if (!res.data.ok) {
        throw new Error(res.data.error.message);
      }

      return res.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Busca usuários por nome ou email
   * GET /usuarios/buscar?q=termo&limite=10
   */
  async buscarUsuarios(
    termo: string,
    limite: number = 10
  ): Promise<Usuario[]> {
    try {
      const res = await api.get<ApiSuccess<Usuario[]>>(
        '/usuarios/buscar',
        {
          params: { q: termo, limite },
        }
      );

      if (!res.data.ok) {
        throw new Error(res.data.error.message);
      }

      return res.data.data || [];
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Handler centralizado de erros
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      if ('response' in error) {
        const response = (error as any).response;
        return new Error(
          response?.data?.error?.message ||
            response?.statusText ||
            'Erro na requisição'
        );
      }
      return error;
    }
    return new Error('Erro desconhecido ao processar usuário');
  },
};

export default usuarioService;
