'use client';

/**
 * /amizades - Página Principal de Amizades
 * 
 * Layout com 3 tabs:
 * 1. Meus Amigos - Lista com paginação e filtro
 * 2. Solicitações - Pendentes para aceitar/recusar
 * 3. Buscar - Procurar e adicionar novos amigos
 * 
 * Requer autenticação (protegida por AuthGuard)
 * 
 * Identidade Visual: Roxo/Oliva com layout responsivo
 */

import { useState } from 'react';
import { Users, UserCheck, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import ListaAmigos from '@/components/Amizades/ListaAmigos';
import SolicitacoesAmizade from '@/components/Amizades/SolicitacoesAmizade';
import BuscadorAmigos from '@/components/Amizades/BuscadorAmigos';

type Tab = 'amigos' | 'solicitacoes' | 'buscar';

function AmizadesContent() {
  const { user } = useAuth();
  const [tabAtiva, setTabAtiva] = useState<Tab>('amigos');
  const [recarregar, setRecarregar] = useState(0);

  const handleAmigoRemovido = () => {
    setRecarregar((prev) => prev + 1);
  };

  const handleAmigoAdicionado = () => {
    setTabAtiva('solicitacoes');
    setRecarregar((prev) => prev + 1);
  };

  const handleSolicitacaoProcessada = () => {
    setRecarregar((prev) => prev + 1);
  };

  const tabs: Array<{ id: Tab; nome: string; icone: React.ReactNode }> = [
    { id: 'amigos', nome: 'Meus Amigos', icone: <Users size={20} /> },
    { id: 'solicitacoes', nome: 'Solicitações', icone: <UserCheck size={20} /> },
    { id: 'buscar', nome: 'Buscar', icone: <UserPlus size={20} /> },
  ];

  if (!user) return null;

  return (
    <main className="min-h-screen bg-if-bg text-if-text pb-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-if-text mb-2">Amizades</h1>
          <p className="text-if-olive/80">Gerencie seus amigos e conexões</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-if-olive/20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabAtiva(tab.id)}
              className={`
                px-4 py-3 rounded-t-main font-medium text-sm
                flex items-center gap-2
                transition-colors duration-200
                border-b-2
                ${
                  tabAtiva === tab.id
                    ? 'text-purple-400 border-b-purple-600 bg-if-card/50'
                    : 'text-if-olive hover:text-if-text border-b-transparent bg-transparent'
                }
              `}
            >
              {tab.icone}
              {tab.nome}
            </button>
          ))}
        </div>

        {/* Conteúdo das Tabs */}
        <div className="bg-if-card/30 rounded-main border border-if-olive/20 p-6">
          {/* Meus Amigos */}
          {tabAtiva === 'amigos' && (
            <ListaAmigos
              key={`amigos-${recarregar}`}
              usuarioId={user.id}
              onAmigoRemovido={handleAmigoRemovido}
            />
          )}

          {/* Solicitações */}
          {tabAtiva === 'solicitacoes' && (
            <SolicitacoesAmizade
              key={`solicitacoes-${recarregar}`}
              onSolicitacaoProcessada={handleSolicitacaoProcessada}
            />
          )}

          {/* Buscar */}
          {tabAtiva === 'buscar' && (
            <BuscadorAmigos
              key={`buscar-${recarregar}`}
              onAmigoAdicionado={handleAmigoAdicionado}
            />
          )}
        </div>

        {/* Dica */}
        <div className="mt-6 p-4 bg-purple-600/10 border border-purple-600/20 rounded-main text-sm text-if-text/80">
          💡 <strong>Dica:</strong> Use a aba Buscar para encontrar e adicionar novos amigos. Quando sua solicitação for aceita, você verá a pessoa na aba Meus Amigos.
        </div>
      </div>
    </main>
  );
}

export default function AmizadesPage() {
  return (
    <AuthGuard>
      <AmizadesContent />
    </AuthGuard>
  );
}
