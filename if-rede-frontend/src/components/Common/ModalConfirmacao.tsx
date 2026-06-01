'use client';

/**
 * ModalConfirmacao Component
 * 
 * Modal para confirmar ações críticas.
 * Customizável com títulos, mensagens e cores.
 * 
 * Props:
 * - titulo: Título do modal
 * - mensagem: Mensagem de confirmação
 * - textoBotaoConfirmar: Texto do botão de confirmar
 * - textoBotaoCancelar: Texto do botão de cancelar
 * - corBotaoConfirmar: Cor do botão ('red', 'purple', 'green')
 * - onConfirmar: Callback ao confirmar
 * - onCancelar: Callback ao cancelar
 * - carregando: Estado de loading
 * - erro: Mensagem de erro
 * 
 * Identidade Visual: Overlay escuro com roxo/oliva
 */

import { AlertCircle } from 'lucide-react';

interface ModalConfirmacaoProps {
  titulo: string;
  mensagem: string;
  textoBotaoConfirmar?: string;
  textoBotaoCancelar?: string;
  corBotaoConfirmar?: 'red' | 'purple' | 'green';
  onConfirmar: () => void | Promise<void>;
  onCancelar: () => void;
  carregando?: boolean;
  erro?: string | null;
}

export default function ModalConfirmacao({
  titulo,
  mensagem,
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  corBotaoConfirmar = 'purple',
  onConfirmar,
  onCancelar,
  carregando = false,
  erro = null,
}: ModalConfirmacaoProps) {
  const corClasses = {
    red: 'bg-red-600 hover:bg-red-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    green: 'bg-green-600 hover:bg-green-700',
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={onCancelar}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="
            bg-if-card rounded-main border border-if-olive/40
            p-6 max-w-sm w-full
            shadow-lg pointer-events-auto
            animate-in fade-in zoom-in-95 duration-200
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-if-text flex-1">{titulo}</h2>
          </div>

          {/* Mensagem */}
          <p className="text-if-text/80 text-sm mb-4 leading-relaxed">
            {mensagem}
          </p>

          {/* Erro */}
          {erro && (
            <div className="bg-red-600/20 border border-red-600/40 rounded-lg p-3 mb-4 text-red-400 text-sm">
              {erro}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onCancelar}
              disabled={carregando}
              className="
                flex-1 px-4 py-2 rounded-lg
                bg-if-olive/20 hover:bg-if-olive/30
                text-if-text
                font-medium text-sm
                transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {textoBotaoCancelar}
            </button>

            <button
              onClick={onConfirmar}
              disabled={carregando}
              className={`
                flex-1 px-4 py-2 rounded-lg
                text-if-text
                font-medium text-sm
                transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                ${corClasses[corBotaoConfirmar]}
              `}
            >
              {carregando && (
                <div className="w-4 h-4 border-2 border-if-text/30 border-t-if-text rounded-full animate-spin" />
              )}
              {textoBotaoConfirmar}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
