'use client';

/**
 * BuscadorAmigos Component
 * 
 * Busca e adição de novos amigos.
 * Features:
 * - Debounce em tempo real
 * - Status de amizade (amigo, pendente, não amigo)
 * - Botão dinâmico baseado no status
 * 
 * Identidade Visual: Roxo/Oliva
 */

import { useState } from 'react';
import { Search, UserPlus, UserCheck, Clock } from 'lucide-react';
import { useBuscador } from '@/hooks/useBuscador';
import { useAmizades } from '@/hooks/useAmizades';
import type { StatusAmizade } from '@/types';

interface BuscadorAmigosProps {
  onAmigoAdicionado?: () => void;
}

interface ResultadoComStatus {
  usuarioId: string;
  nome: string;
  bio?: string;
  avatar?: string;
  status: StatusAmizade | null;
}

export default function BuscadorAmigos({
  onAmigoAdicionado,
}: BuscadorAmigosProps) {
  const { resultados, termo, loading, buscar, limpar } = useBuscador(500, 10);
  const { enviarSolicitacao, verificarStatus } = useAmizades();

  const [statusCache, setStatusCache] = useState<Map<string, StatusAmizade | null>>(
    new Map()
  );
  const [enviando, setEnviando] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const handleBuscar = async (novoTermo: string) => {
    buscar(novoTermo);

    // Verificar status de amizade para cada resultado
    if (resultados.length > 0) {
      for (const resultado of resultados) {
        const usuarioId = resultado.id || resultado._id || '';
        if (!statusCache.has(usuarioId)) {
          const status = await verificarStatus(usuarioId);
          setStatusCache((prev) => {
            const novo = new Map(prev);
            novo.set(usuarioId, status);
            return novo;
          });
        }
      }
    }
  };

  const handleEnviarSolicitacao = async (usuarioId: string) => {
    setEnviando(usuarioId);
    setErroEnvio(null);

    try {
      await enviarSolicitacao(usuarioId);
      // Atualizar status no cache
      setStatusCache((prev) => {
        const novo = new Map(prev);
        novo.set(usuarioId, 'solicitacao_enviada');
        return novo;
      });
      onAmigoAdicionado?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar solicitação';
      setErroEnvio(msg);
    } finally {
      setEnviando(null);
    }
  };

  const getStatusBadge = (status: StatusAmizade | null) => {
    switch (status) {
      case 'amigo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
            <UserCheck size={14} />
            Amigo
          </span>
        );
      case 'solicitacao_enviada':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded-full">
            <Clock size={14} />
            Pendente
          </span>
        );
      case 'solicitacao_recebida':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
            <Clock size={14} />
            Responder
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Input de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-if-olive pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar usuários por nome ou email..."
          value={termo}
          onChange={(e) => handleBuscar(e.target.value)}
          className="
            w-full pl-10 pr-4 py-3
            bg-if-card border border-if-olive/30
            rounded-main text-if-text
            placeholder:text-if-olive/50
            focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent
          "
        />
        {termo && (
          <button
            onClick={() => {
              limpar();
              setStatusCache(new Map());
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-if-olive/50 hover:text-if-olive"
          >
            ✕
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-if-olive border-t-purple-600" />
        </div>
      )}

      {/* Erro */}
      {erroEnvio && (
        <div className="bg-red-600/20 border border-red-600/40 rounded-main p-3 text-red-400 text-sm">
          {erroEnvio}
        </div>
      )}

      {/* Resultados */}
      {!loading && termo.trim() && resultados.length > 0 && (
        <div className="space-y-3">
          {resultados.map((usuario) => {
            const usuarioId = usuario.id || usuario._id || '';
            const nome = usuario.perfil?.nome || 'Usuário';
            const bio = usuario.perfil?.bio || '';
            const avatar = usuario.customizacao?.banner_url || '/avatar-default.png';
            const status = statusCache.get(usuarioId);
            const enviandoItem = enviando === usuarioId;

            return (
              <div
                key={usuarioId}
                className="
                  bg-if-card rounded-main border border-if-olive/30
                  p-4 flex items-center gap-4
                  hover:shadow-card transition-shadow duration-200
                "
              >
                {/* Avatar e Info */}
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <img
                    src={avatar}
                    alt={nome}
                    className="w-12 h-12 rounded-full object-cover bg-if-olive/20 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/avatar-default.png';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-if-text truncate">{nome}</p>
                    {bio && (
                      <p className="text-sm text-if-olive/70 truncate">{bio}</p>
                    )}
                  </div>
                </div>

                {/* Status e Botão */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {getStatusBadge(status ?? null)}

                  {status === 'nao_amigo' && (
                    <button
                      onClick={() => handleEnviarSolicitacao(usuarioId)}
                      disabled={enviandoItem}
                      className="
                        p-2 rounded-lg
                        bg-purple-600 hover:bg-purple-700
                        text-if-text
                        transition-colors duration-150
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center gap-2
                      "
                    >
                      <UserPlus size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && termo.trim() && resultados.length === 0 && (
        <div className="text-center py-8 bg-if-card/30 rounded-main border border-if-olive/20 p-6">
          <p className="text-if-olive">Nenhum usuário encontrado</p>
          <p className="text-if-text/60 text-sm mt-1">
            Tente procurar por outro nome ou email
          </p>
        </div>
      )}

      {/* Sugestão inicial */}
      {!termo && (
        <div className="text-center py-8 bg-if-card/30 rounded-main border border-if-olive/20 p-6">
          <p className="text-if-olive">Digite um nome ou email para buscar</p>
        </div>
      )}
    </div>
  );
}
