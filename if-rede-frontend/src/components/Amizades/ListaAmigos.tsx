'use client';

/**
 * ListaAmigos Component
 * 
 * Lista de amigos com:
 * - Grid responsivo de cards
 * - Paginação
 * - Filtro por nome (client-side)
 * - Loading e estado vazio
 * 
 * Props:
 * - usuarioId: ID do usuário para carregar amigos
 * - onAmigoRemovido: Callback quando amigo removido
 * 
 * Identidade Visual: Tema roxo/oliva
 */

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useAmizades } from '@/hooks/useAmizades';
import CartaoAmigo from './CartaoAmigo';
import ModalConfirmacao from '../Common/ModalConfirmacao';
import ModalCarregamento from '../Common/ModalCarregamento';

interface ListaAmigosProps {
  usuarioId: string;
  onAmigoRemovido?: () => void;
}

export default function ListaAmigos({
  usuarioId,
  onAmigoRemovido,
}: ListaAmigosProps) {
  const { amigos, paginacao, loading, error, carregarAmigos, desfazerAmizade } =
    useAmizades();

  const [filtro, setFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [amigoSelecionado, setAmigoSelecionado] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [erroRemocao, setErroRemocao] = useState<string | null>(null);

  // Carregar amigos quando usuarioId ou página mudar
  useEffect(() => {
    carregarAmigos(usuarioId, pagina);
  }, [usuarioId, pagina, carregarAmigos]);

  // Filtrar amigos por nome
  const amigosFiltrados = useMemo(() => {
    if (!filtro.trim()) return amigos;

    return amigos.filter((amigo) =>
      amigo.perfil?.nome?.toLowerCase().includes(filtro.toLowerCase())
    );
  }, [amigos, filtro]);

  const handleRemover = async (amigoId: string) => {
    setAmigoSelecionado(amigoId);
  };

  const confirmarRemocao = async () => {
    if (!amigoSelecionado) return;

    setRemovendo(true);
    setErroRemocao(null);

    try {
      await desfazerAmizade(amigoSelecionado);
      setAmigoSelecionado(null);
      onAmigoRemovido?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover amigo';
      setErroRemocao(msg);
    } finally {
      setRemovendo(false);
    }
  };

  if (loading && amigos.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-if-olive border-t-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-600/20 border border-red-600/40 rounded-main p-4 text-red-400">
        <p className="font-medium">Erro ao carregar amigos</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (amigos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-if-olive text-lg font-medium">Nenhum amigo ainda</p>
        <p className="text-if-text/60 text-sm mt-1">
          Comece a buscar e adicionar amigos!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtro */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-if-olive pointer-events-none" />
        <input
          type="text"
          placeholder="Filtrar amigos por nome..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="
            w-full pl-10 pr-4 py-2
            bg-if-card border border-if-olive/30
            rounded-main text-if-text
            placeholder:text-if-olive/50
            focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent
          "
        />
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {amigosFiltrados.map((amigo) => (
          <CartaoAmigo
            key={amigo._id}
            usuario={amigo}
            onRemover={handleRemover}
            removendo={removendo && amigoSelecionado === (amigo.id || amigo._id)}
          />
        ))}
      </div>

      {/* Estado vazio com filtro */}
      {amigosFiltrados.length === 0 && filtro.trim() && (
        <div className="text-center py-8">
          <p className="text-if-olive">Nenhum amigo encontrado</p>
        </div>
      )}

      {/* Paginação */}
      {paginacao.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="
              p-2 rounded-lg
              bg-if-card border border-if-olive/30
              text-if-text hover:bg-if-olive/20
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150
            "
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-if-text text-sm font-medium">
            Página {pagina} de {paginacao.totalPages}
          </span>

          <button
            onClick={() => setPagina((p) => Math.min(paginacao.totalPages, p + 1))}
            disabled={pagina === paginacao.totalPages}
            className="
              p-2 rounded-lg
              bg-if-card border border-if-olive/30
              text-if-text hover:bg-if-olive/20
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150
            "
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Modal de Confirmação */}
      {amigoSelecionado && (
        <ModalConfirmacao
          titulo="Remover amigo?"
          mensagem="Você tem certeza que deseja remover este amigo? Você poderá adiciona-lo novamente depois."
          textoBotaoConfirmar="Remover"
          textoBotaoCancelar="Cancelar"
          corBotaoConfirmar="red"
          onConfirmar={confirmarRemocao}
          onCancelar={() => setAmigoSelecionado(null)}
          carregando={removendo}
          erro={erroRemocao}
        />
      )}

      {/* Modal de Carregamento */}
      {loading && amigoSelecionado && (
        <ModalCarregamento mensagem="Processando..." />
      )}
    </div>
  );
}
