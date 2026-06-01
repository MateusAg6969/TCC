'use client';

/**
 * /perfil/editar - Página de Edição de Perfil
 * 
 * Formulário para editar:
 * - Nome
 * - Bio
 * - Foto/Avatar
 * - Privacidade do perfil
 * 
 * Requer autenticação (protegida por AuthGuard)
 * 
 * Identidade Visual: Roxo/Oliva com form estilizado
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import EditarPerfil from '@/components/PerfisUsuario/EditarPerfil';
import { useUsuario } from '@/hooks/useUsuario';

function EditarPerfilContent() {
  const { user } = useAuth();
  const { usuarioAtual, carregarMeuPerfil, loading } = useUsuario();
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarMeuPerfil().finally(() => setCarregando(false));
  }, [carregarMeuPerfil]);

  if (carregando || loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-if-olive border-t-purple-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-if-bg text-if-text pb-12">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-if-text mb-2">Editar Perfil</h1>
          <p className="text-if-olive/80">Atualize suas informações pessoais</p>
        </div>

        {/* Form */}
        <EditarPerfil
          usuarioInicial={{
            nome: usuarioAtual?.perfil?.nome || '',
            bio: usuarioAtual?.perfil?.bio || '',
            avatar: usuarioAtual?.customizacao?.banner_url,
          }}
        />
      </div>
    </main>
  );
}

export default function EditarPerfilPage() {
  return (
    <AuthGuard>
      <EditarPerfilContent />
    </AuthGuard>
  );
}
