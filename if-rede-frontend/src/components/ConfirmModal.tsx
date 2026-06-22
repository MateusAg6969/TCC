'use client';

import { X, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCancel}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-if-card/95 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 animate-in fade-in zoom-in-95 duration-300 overflow-hidden flex flex-col">
        {/* Header Decorativo */}
        <div className={`h-2 w-full ${isDestructive ? 'bg-red-500' : 'bg-if-purple'}`} />
        
        <div className="p-6 md:p-8">
          <button 
            onClick={onCancel}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-if-text/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
          
          <div className="flex flex-col items-center text-center mt-2">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 ${
              isDestructive 
                ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/10' 
                : 'bg-if-purple/10 text-if-purple border-if-purple/20 shadow-if-purple/10'
            }`}>
              <AlertTriangle size={32} />
            </div>
            
            <h3 className="text-xl font-black text-white mb-3">
              {title}
            </h3>
            <p className="text-sm text-if-text/70 leading-relaxed font-medium">
              {message}
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center gap-3 mt-8">
            <button
              onClick={onCancel}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-white/5 text-white hover:bg-white/10 transition-all focus:ring-2 focus:ring-white/20 outline-none"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
              }}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all focus:ring-2 outline-none ${
                isDestructive 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20 focus:ring-red-500/40' 
                  : 'bg-if-purple hover:bg-if-purple-dark shadow-if-purple/20 focus:ring-if-purple/40'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
