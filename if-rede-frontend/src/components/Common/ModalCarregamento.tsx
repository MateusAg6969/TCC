'use client';

/**
 * ModalCarregamento Component
 * 
 * Modal de loading durante operações assíncronas.
 * Simples e minimalista com spinner animado.
 * 
 * Props:
 * - mensagem: Mensagem exibida
 * - aberto: Se está aberto ou não
 * 
 * Identidade Visual: Overlay com tema roxo/oliva
 */

interface ModalCarregamentoProps {
  mensagem?: string;
  aberto?: boolean;
}

export default function ModalCarregamento({
  mensagem = 'Carregando...',
  aberto = true,
}: ModalCarregamentoProps) {
  if (!aberto) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="
            bg-if-card rounded-main border border-if-olive/40
            p-8 max-w-sm w-full
            shadow-lg
            flex flex-col items-center gap-4
          "
        >
          {/* Spinner */}
          <div className="w-12 h-12 border-4 border-if-olive/30 border-t-purple-600 rounded-full animate-spin" />

          {/* Mensagem */}
          {mensagem && (
            <p className="text-if-text font-medium text-center">{mensagem}</p>
          )}
        </div>
      </div>
    </>
  );
}
