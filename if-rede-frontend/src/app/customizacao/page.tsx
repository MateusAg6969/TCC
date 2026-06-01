'use client';

/**
 * /customizacao - Página de Customização de Tema
 * 
 * Panel para customizar:
 * - Cores de fundo e botões
 * - Tema (claro/escuro/roxo)
 * - Preview em tempo real
 * 
 * Requer autenticação (protegida por AuthGuard)
 * 
 * Identidade Visual: Roxo/Oliva com preview visual
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import MinhaCustomizacao from '@/components/PerfisUsuario/MinhaCustomizacao';
import { useUsuario } from '@/hooks/useUsuario';

function CustomizacaoContent() {
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-if-text mb-2">
            Customização Visual
          </h1>
          <p className="text-if-olive/80">
            Personalize a aparência do seu perfil
          </p>
        </div>

        {/* Customization Panel */}
        <MinhaCustomizacao
          customizacaoInicial={{
            cor_fundo: usuarioAtual?.customizacao?.cor_fundo || '#2D1B2D',
            cor_botoes: usuarioAtual?.customizacao?.cor_botoes || '#8F9972',
            tema:
              (usuarioAtual?.customizacao?.tema as any) || 'escuro',
          }}
        />

        {/* Info */}
        <div className="mt-8 p-4 bg-if-olive/10 border border-if-olive/30 rounded-main text-sm text-if-text/80">
          ℹ️ <strong>Dica:</strong> Escolha uma paleta que combine com sua
          personalidade! Você pode sempre voltar aqui e mudar as cores.
        </div>
      </div>
    </main>
  );
}

export default function CustomizacaoPage() {
  return (
    <AuthGuard>
      <CustomizacaoContent />
    </AuthGuard>
  );
}
