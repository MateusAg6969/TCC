'use client';

/**
 * PerfilUsuario Component
 * 
 * Exibe dados de um perfil de usuário.
 * Se for o perfil do usuário autenticado, mostra botão de editar.
 * Se for outro usuário, mostra botão de adicionar como amigo.
 * 
 * Props:
 * - usuarioId: ID do usuário a exibir
 * - usuarioAtualId: ID do usuário autenticado (para comparação)
 * - onAmigoAdicionado: Callback quando amizade é criada
 * 
 * Identidade Visual: Roxo/Oliva com cards e stats
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit2, UserPlus, Users, FileText, Loader } from 'lucide-react';
import { useUsuario } from '@/hooks/useUsuario';
import { useAmizades } from '@/hooks/useAmizades';
import type { StatusAmizade } from '@/types';

interface PerfilUsuarioProps {
  usuarioId: string;
  usuarioAtualId?: string;
  onAmigoAdicionado?: () => void;
}

export default function PerfilUsuario({
  usuarioId,
  usuarioAtualId,
  onAmigoAdicionado,
}: PerfilUsuarioProps) {
  const { obterPerfil } = useUsuario();
  const { enviarSolicitacao, verificarStatus } = useAmizades();

  const [carregando, setCarregando] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [statusAmizade, setStatusAmizade] = useState<StatusAmizade | null>(null);
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);
  const [erroSolicitacao, setErroSolicitacao] = useState<string | null>(null);

  const ehPerfilProprio = usuarioId === usuarioAtualId;

  useEffect(() => {
    const carregarPerfil = async () => {
      setCarregando(true);
      setErro(null);

      try {
        const dados = await obterPerfil(usuarioId);
        if (!dados) {
          setErro('Perfil não encontrado');
          return;
        }

        setPerfil(dados);

        // Se não for perfil próprio, verificar status de amizade
        if (!ehPerfilProprio) {
          const status = await verificarStatus(usuarioId);
          setStatusAmizade(status);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao carregar perfil';
        setErro(msg);
      } finally {
        setCarregando(false);
      }
    };

    carregarPerfil();
  }, [usuarioId, ehPerfilProprio, obterPerfil, verificarStatus]);

  const handleEnviarSolicitacao = async () => {
    setEnviandoSolicitacao(true);
    setErroSolicitacao(null);

    try {
      await enviarSolicitacao(usuarioId);
      setStatusAmizade('solicitacao_enviada');
      onAmigoAdicionado?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar solicitação';
      setErroSolicitacao(msg);
    } finally {
      setEnviandoSolicitacao(false);
    }
  };

  const getBotaoAmizade = () => {
    switch (statusAmizade) {
      case 'amigo':
        return (
          <button
            disabled
            className="
              px-4 py-2 rounded-main
              bg-green-600/20 text-green-400
              font-medium text-sm
              flex items-center gap-2
              cursor-not-allowed
            "
          >
            <Users size={16} />
            Vocês são amigos
          </button>
        );
      case 'solicitacao_enviada':
        return (
          <button
            disabled
            className="
              px-4 py-2 rounded-main
              bg-yellow-600/20 text-yellow-400
              font-medium text-sm
              flex items-center gap-2
              cursor-not-allowed
            "
          >
            <Loader size={16} className="animate-spin" />
            Solicitação enviada
          </button>
        );
      case 'solicitacao_recebida':
        return (
          <Link
            href="/amizades"
            className="
              px-4 py-2 rounded-main
              bg-blue-600/20 text-blue-400
              font-medium text-sm
              flex items-center gap-2
              hover:bg-blue-600/30
              transition-colors
            "
          >
            Responder solicitação
          </Link>
        );
      default:
        return (
          <button
            onClick={handleEnviarSolicitacao}
            disabled={enviandoSolicitacao}
            className="
              px-4 py-2 rounded-main
              bg-purple-600 hover:bg-purple-700
              text-if-text font-medium text-sm
              flex items-center gap-2
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <UserPlus size={16} />
            Adicionar como Amigo
          </button>
        );
    }
  };

  if (carregando) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-if-olive border-t-purple-600" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-red-600/20 border border-red-600/40 rounded-main p-6 text-red-400">
        <p className="font-medium">{erro}</p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="text-center py-12 text-if-olive">
        Perfil não encontrado
      </div>
    );
  }

  const nome = perfil.perfil?.nome || 'Usuário';
  const bio = perfil.perfil?.bio || '';
  const avatar = perfil.customizacao?.banner_url || '/avatar-default.png';
  const totalAmigos = perfil.stats?.total_seguidores || 0;
  const totalPostagens = perfil.stats?.total_postagens || 0;

  const styleVars = {
    '--profile-bg': perfil.customizacao?.cor_fundo || '#2D1B2D',
    '--profile-botoes': perfil.customizacao?.cor_botoes || '#8F9972',
  } as React.CSSProperties;

  return (
    <div className="space-y-6" style={styleVars}>
      {/* Card Principal */}
      <div className="bg-if-card rounded-main border border-if-olive/30 overflow-hidden shadow-card">
        {/* Background customizado */}
        <div
          className="h-32"
          style={{ backgroundColor: `var(--profile-bg, #2D1B2D)` }}
        />

        {/* Conteúdo */}
        <div className="px-6 py-4 space-y-4 relative -mt-16 pb-20">
          {/* Avatar */}
          <div className="flex justify-between items-start">
            <img
              src={avatar}
              alt={nome}
              className="w-32 h-32 rounded-full object-cover border-4 border-if-card bg-if-olive/20"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/avatar-default.png';
              }}
            />

            {/* Botões de Ação */}
            <div className="flex gap-2">
              {ehPerfilProprio && (
                <Link
                  href="/perfil/editar"
                  className="
                    px-4 py-2 rounded-main
                    bg-purple-600 hover:bg-purple-700
                    text-if-text font-medium text-sm
                    flex items-center gap-2
                    transition-colors
                  "
                >
                  <Edit2 size={16} />
                  Editar
                </Link>
              )}

              {!ehPerfilProprio && (
                <>
                  {getBotaoAmizade()}
                  {erroSolicitacao && (
                    <div className="text-red-400 text-xs mt-2">
                      {erroSolicitacao}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Nome e Bio */}
          <div>
            <h1 className="text-3xl font-bold text-if-text">{nome}</h1>
            {bio && (
              <p className="text-if-olive/80 mt-2">{bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-if-card rounded-main border border-if-olive/30 p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{totalAmigos}</p>
          <p className="text-if-olive text-sm mt-1 flex items-center justify-center gap-1">
            <Users size={16} />
            Amigos
          </p>
        </div>

        <div className="bg-if-card rounded-main border border-if-olive/30 p-4 text-center">
          <p className="text-2xl font-bold text-if-olive">{totalPostagens}</p>
          <p className="text-if-olive text-sm mt-1 flex items-center justify-center gap-1">
            <FileText size={16} />
            Postagens
          </p>
        </div>
      </div>

      {/* Link para amigos */}
      {totalAmigos > 0 && (
        <Link
          href={`/usuarios/${usuarioId}/amigos`}
          className="
            w-full px-4 py-3 rounded-main
            bg-if-olive/20 hover:bg-if-olive/30
            text-if-text font-medium
            transition-colors
            flex items-center justify-center gap-2
          "
        >
          <Users size={18} />
          Ver Amigos ({totalAmigos})
        </Link>
      )}
    </div>
  );
}
