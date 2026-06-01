/**
 * Service de Amizades
 * 
 * Responsável por todas as operações de amizade via API:
 * - Enviar/aceitar/recusar solicitações
 * - Listar amigos e solicitações
 * - Verificar status de amizade
 * - Desfazer amizades
 * 
 * Fluxo: Component (Client) -> Hook useAmizades -> amizadeService -> API Backend
 */

import api from '@/lib/api';
import type { Amizade, SolicitacaoAmizade, Usuario, ApiSuccess, ApiError } from '@/types';

type ApiResponse<T> = ApiSuccess<T> | ApiError;

export const amizadeService = {
  /**
   * Envia solicitação de amizade para um usuário
   * POST /amizades/solicitar
   */
  async enviarSolicitacao(usuarioDestId: string): Promise<Amizade> {
    try {
      const res = await api.post<ApiResponse<Amizade>>('/amizades/solicitar', {
        usuario_destino_id: usuarioDestId,
      });

      if (!res.data.ok) {
        throw new Error(res.data.error.message);
      }

      return res.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Aceita solicitação de amizade
   * POST /amizades/aceitar/:id
   */
  async aceitarSolicitacao(amizadeId: string): Promise<Amizade> {
    try {
      const res = await api.post<ApiResponse<Amizade>>(
        `/amizades/aceitar/${amizadeId}`
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
   * Recusa solicitação de amizade
   * POST /amizades/recusar/:id
   */
  async recusarSolicitacao(amizadeId: string): Promise<void> {
    try {
      const res = await api.post<ApiResponse<null>>(
        `/amizades/recusar/${amizadeId}`
      );

      if (!res.data.ok) {
        throw new Error(res.data.error.message);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Desfaz amizade existente
   * DELETE /amizades/:id
   */
  async desfazerAmizade(amizadeId: string): Promise<void> {
    try {
      const res = await api.delete<ApiResponse<null>>(
        `/amizades/${amizadeId}`
      );

      if (!res.data.ok) {
        throw new Error(res.data.error.message);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Lista amigos de um usuário com paginação
   * GET /usuarios/:id/amigos?pagina=1&limite=20
   */
  async listarAmigos(
    usuarioId: string,
    pagina: number = 1,
    limite: number = 20
  ): Promise<{
    amigos: Usuario[];
    paginacao: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const res = await api.get<
        ApiSuccess<{
          amigos: Usuario[];
        }>
      >(`/usuarios/${usuarioId}/amigos`, {
        params: { pagina, limite },
      });

      if (!res.data.ok) {
        throw new Error(res.data.error.message);
      }

      return {
        amigos: res.data.data.amigos,
        paginacao: res.data.meta || {
          page: pagina,
          limit: limite,
          total: res.data.data.amigos.length,
          totalPages: Math.ceil(res.data.data.amigos.length / limite),
        },
      };
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Lista solicitações de amizade pendentes do usuário autenticado
   * GET /amizades/solicitacoes/pendentes
   */
  async listarSolicitacoes(): Promise<SolicitacaoAmizade[]> {
    try {
      const res = await api.get<ApiSuccess<SolicitacaoAmizade[]>>(
        '/amizades/solicitacoes/pendentes'
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
   * Verifica status de amizade entre o usuário autenticado e outro
   * GET /amizades/status/:usuarioId
   * Retorna: 'amigo' | 'solicitacao_enviada' | 'solicitacao_recebida' | 'nao_amigo'
   */
  async verificarAmizade(usuarioId: string): Promise<string> {
    try {
      const res = await api.get<ApiSuccess<{ status: string }>>(
        `/amizades/status/${usuarioId}`
      );

      if (!res.data.ok) {
        throw new Error(res.data.error.message);
      }

      return res.data.data.status;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Handler centralizado de erros
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      // Se for erro de rede/axios, extrair mensagem melhor
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
    return new Error('Erro desconhecido ao processar amizade');
  },
};

export default amizadeService;
