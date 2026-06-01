'use client';

/**
 * CartaoAmigo Component
 * 
 * Card que exibe informações de um amigo:
 * - Avatar
 * - Nome
 * - Bio
 * - Botões de ação (Remover, Ver Perfil)
 * 
 * Props:
 * - usuario: Dados do usuário amigo
 * - onRemover: Callback quando clicar em remover
 * - onVerPerfil: Callback quando clicar em ver perfil
 * 
 * Identidade Visual: Roxo/Oliva com cards em tema escuro
 */

import Link from 'next/link';
import { Trash2, User } from 'lucide-react';
import type { Usuario } from '@/types';

interface CartaoAmigoProps {
  usuario: Usuario;
  onRemover?: (usuarioId: string) => void;
  onVerPerfil?: (usuarioId: string) => void;
  removendo?: boolean;
}

export default function CartaoAmigo({
  usuario,
  onRemover,
  onVerPerfil,
  removendo = false,
}: CartaoAmigoProps) {
  const usuarioId = usuario.id || usuario._id || '';
  const nome = usuario.perfil?.nome || 'Usuário';
  const bio = usuario.perfil?.bio || 'Sem bio';
  const avatar = usuario.customizacao?.banner_url || '/avatar-default.png';

  return (
    <div
      className="
        bg-if-card rounded-main border border-if-olive/30
        p-4 flex flex-col gap-3
        hover:shadow-card transition-shadow duration-200
      "
    >
      {/* Avatar e Nome */}
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt={nome}
          className="w-12 h-12 rounded-full object-cover bg-if-olive/20"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/avatar-default.png';
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-if-text truncate">{nome}</h3>
          <p className="text-sm text-if-olive truncate">{bio}</p>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-2">
        {/* Ver Perfil */}
        <Link
          href={`/profile/${usuarioId}`}
          className="
            flex-1 px-3 py-2 rounded-lg
            bg-purple-600 hover:bg-purple-700
            text-if-text text-sm font-medium
            transition-colors duration-150
            flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <User size={16} />
          <span>Perfil</span>
        </Link>

        {/* Remover */}
        {onRemover && (
          <button
            onClick={() => onRemover(usuarioId)}
            disabled={removendo}
            className="
              px-3 py-2 rounded-lg
              bg-red-600/20 hover:bg-red-600/40
              text-red-400 hover:text-red-300
              text-sm font-medium
              transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            title="Remover amigo"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
