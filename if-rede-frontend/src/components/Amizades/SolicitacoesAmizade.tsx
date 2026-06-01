'use client';

/**
 * SolicitacoesAmizade Component
 * 
 * Panel que exibe solicitações de amizade pendentes.
 * Permite aceitar ou recusar solicitações.
 * 
 * Identidade Visual: Roxo/Oliva com cards destacados
 */

import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useAmizades } from '@/hooks/useAmizades';
import type { SolicitacaoAmizade } from '@/types';

interface SolicitacoesAmizadeProps {
  onSolicitacaoProcessada?: () => void;
}

export default function SolicitacoesAmizade({
  onSolicitacaoProcessada,
}: SolicitacoesAmizadeProps) {
  const { solicitacoes, loading, error, carregarSolicitacoes, aceitarSolicitacao, recusarSolicitacao } =
    useAmizades();

  const [processando, setProcessando] = useState<string | null>(null);
  const [erroProcessamento, setErroProcessamento] = useState<string | null>(null);

  // Carregar solicitações ao montar
  useEffect(() => {
    carregarSolicitacoes();
  }, [carregarSolicitacoes]);

  const handleAceitar = async (solicitacao: SolicitacaoAmizade) => {
    setProcessando(solicitacao._id);
    setErroProcessamento(null);

    try {
      await aceitarSolicitacao(solicitacao._id);
      onSolicitacaoProcessada?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao aceitar';
      setErroProcessamento(msg);
    } finally {
      setProcessando(null);
    }
  };

  const handleRecusar = async (solicitacao: SolicitacaoAmizade) => {
    setProcessando(solicitacao._id);
    setErroProcessamento(null);

    try {
      await recusarSolicitacao(solicitacao._id);
      onSolicitacaoProcessada?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao recusar';
      setErroProcessamento(msg);
    } finally {
      setProcessando(null);
    }
  };

  if (loading && solicitacoes.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-if-olive border-t-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-600/20 border border-red-600/40 rounded-main p-4 text-red-400">
        <p className="font-medium">Erro ao carregar solicitações</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (solicitacoes.length === 0) {
    return (
      <div className="text-center py-12 bg-if-card/30 rounded-main border border-if-olive/20 p-8">
        <p className="text-if-olive text-lg font-medium">Nenhuma solicitação</p>
        <p className="text-if-text/60 text-sm mt-1">
          Você está em dia com as solicitações de amizade
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Badge de contador */}
      <div className="inline-block bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
        {solicitacoes.length} solicitação{solicitacoes.length !== 1 ? 's' : ''}
      </div>

      {/* Erro de processamento */}
      {erroProcessamento && (
        <div className="bg-red-600/20 border border-red-600/40 rounded-main p-3 text-red-400 text-sm">
          {erroProcessamento}
        </div>
      )}

      {/* Lista de solicitações */}
      <div className="space-y-3">
        {solicitacoes.map((solicitacao) => {
          const usuarioOrigem = solicitacao.usuario_origem_id;
          const nome = usuarioOrigem.perfil?.nome || 'Usuário';
          const bio = usuarioOrigem.perfil?.bio || '';
          const avatar = usuarioOrigem.customizacao?.banner_url || '/avatar-default.png';
          const processando_item = processando === solicitacao._id;

          return (
            <div
              key={solicitacao._id}
              className="
                bg-if-card rounded-main border border-if-olive/30
                p-4 flex items-center gap-4
                hover:shadow-card transition-shadow duration-200
              "
            >
              {/* Avatar e Info */}
              <div className="flex-1 flex items-center gap-3">
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
                  <p className="text-xs text-if-olive/50 mt-1">
                    {new Date(solicitacao.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAceitar(solicitacao)}
                  disabled={processando_item}
                  className="
                    p-2 rounded-lg
                    bg-green-600/20 hover:bg-green-600/40
                    text-green-400 hover:text-green-300
                    transition-colors duration-150
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  title="Aceitar"
                >
                  <Check size={18} />
                </button>

                <button
                  onClick={() => handleRecusar(solicitacao)}
                  disabled={processando_item}
                  className="
                    p-2 rounded-lg
                    bg-red-600/20 hover:bg-red-600/40
                    text-red-400 hover:text-red-300
                    transition-colors duration-150
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  title="Recusar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
