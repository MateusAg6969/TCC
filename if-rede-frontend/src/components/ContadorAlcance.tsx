'use client';

import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';

interface ContadorAlcanceProps {
  postId: string;
  alcanceInicial: number;
  isAutor: boolean;
}

/**
 * ============================================================================
 * COMPONENTE: CONTADOR DE ALCANCE (v2.0 - Otimizado)
 * ============================================================================
 * O que faz: Exibe a contagem de usuários únicos que visualizaram a postagem.
 * Correção Auditoria: Agora utiliza o socket global para evitar memory leaks 
 * e conexões redundantes. Adicionado efeito visual de pulso.
 */
export default function ContadorAlcance({ postId, alcanceInicial, isAutor }: ContadorAlcanceProps) {
  const [alcance, setAlcance] = useState(alcanceInicial);
  const [pulso, setPulso] = useState(false);
  const { socket } = useNotifications();

  // Sincroniza estado com props (importante para navegação SPA)
  useEffect(() => {
    setAlcance(alcanceInicial);
  }, [alcanceInicial]);

  useEffect(() => {
    // Apenas o autor precisa ouvir atualizações em tempo real
    if (!isAutor || !socket) return;

    const handleUpdate = (data: { postId: string; alcance: number }) => {
      if (data.postId === postId) {
        setAlcance(data.alcance);
        
        // Feedback Visual: Gatilho de animação
        setPulso(true);
        setTimeout(() => setPulso(false), 800);
      }
    };

    // Registrar ouvinte no socket compartilhado
    socket.on('post_alcance_atualizado', handleUpdate);

    // Cleanup: Remove ouvinte ao desmontar para evitar vazamento de memória
    return () => {
      socket.off('post_alcance_atualizado', handleUpdate);
    };
  }, [postId, isAutor, socket]);

  return (
    <div 
      className={`flex items-center gap-1.5 transition-all duration-500 ${
        pulso 
          ? 'text-if-purple scale-110 font-black' 
          : 'text-if-text/40 font-medium'
      }`}
      title={`Alcance: ${alcance} visualizações únicas`}
      aria-label={`Alcance: ${alcance} visualizações únicas`}
    >
      <Eye 
        size={16} 
        className={`transition-transform ${pulso ? 'animate-bounce' : ''}`} 
      />
      <span className="text-[11px] font-mono leading-none">
        {alcance}
      </span>
    </div>
  );
}
