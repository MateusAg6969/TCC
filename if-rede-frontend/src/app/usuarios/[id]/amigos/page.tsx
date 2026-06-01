'use client';

/**
 * /usuarios/[id]/amigos - Página de Amigos de um Usuário
 * 
 * Exibe a lista de amigos de um usuário específico.
 * Público (visível para qualquer um, a menos que perfil seja privado)
 * 
 * Identidade Visual: Roxo/Oliva com grid de cards
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ListaAmigos from '@/components/Amizades/ListaAmigos';

export default function AmigosUsuarioPage() {
  const params = useParams();
  const usuarioId = params.id as string;

  return (
    <main className="min-h-screen bg-if-bg text-if-text pb-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header com voltar */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href={`/profile/${usuarioId}`}
            className="
              p-2 rounded-lg
              bg-if-card/50 hover:bg-if-card
              text-if-olive
              transition-colors
            "
            title="Voltar ao perfil"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-if-text">Amigos</h1>
            <p className="text-if-olive/80">Veja quem é amigo deste usuário</p>
          </div>
        </div>

        {/* Lista de amigos */}
        <ListaAmigos usuarioId={usuarioId} />
      </div>
    </main>
  );
}
