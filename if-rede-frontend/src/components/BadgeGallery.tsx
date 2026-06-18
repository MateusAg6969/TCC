'use client';

import { Medalha } from '@/types';
import Image from 'next/image';
import { Award, Info } from 'lucide-react';

interface BadgeGalleryProps {
  medalhas?: Medalha[];
}

/**
 * ============================================================================
 * COMPONENTE: BADGE GALLERY (Gamificação)
 * ============================================================================
 * O que faz: Exibe a coleção de selos acadêmicos conquistados pelo usuário.
 * Estilo: Grid responsivo com tooltips informativos no hover.
 */
export default function BadgeGallery({ medalhas = [] }: BadgeGalleryProps) {
  return (
    <div className="rounded-main bg-if-card p-6 border border-white/5 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-if-purple flex items-center gap-2">
          <Award size={24} />
          Conquistas Acadêmicas
        </h3>
        <span className="text-[10px] font-black uppercase tracking-widest bg-if-purple/10 text-if-purple px-2 py-1 rounded">
          {medalhas.length} Desbloqueados
        </span>
      </div>

      {medalhas.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {medalhas.map((medalha) => (
            <div 
              key={medalha._id} 
              className="group relative flex flex-col items-center justify-center p-2 rounded-2xl bg-white/5 border border-white/5 hover:bg-if-purple/10 hover:border-if-purple/20 transition-all cursor-help"
            >
              {/* Ícone do Selo */}
              <div className="relative h-12 w-12 md:h-14 md:w-14 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300">
                <Image
                  src={medalha.icone_url}
                  alt={medalha.nome}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Tooltip Elegante */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-if-bg border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                <p className="font-black text-if-purple text-xs mb-1 uppercase tracking-tight">{medalha.nome}</p>
                <p className="text-[10px] text-if-text/60 leading-relaxed font-medium">
                  {medalha.descricao}
                </p>
                {medalha.awarded_at && (
                  <p className="mt-2 pt-2 border-t border-white/5 text-[8px] font-bold text-if-olive uppercase">
                    Conquistado em {new Date(medalha.awarded_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
                {/* Seta do Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-if-bg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 px-6 text-center border-2 border-dashed border-white/5 rounded-2xl bg-black/10">
          <div className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-if-text/20">
            <Award size={24} />
          </div>
          <p className="text-sm font-bold text-if-text/40 italic leading-relaxed">
            Nenhum selo conquistado ainda.<br />
            <span className="text-[11px] not-italic text-if-purple/50">
              Participe das atividades do IFC para desbloquear conquistas!
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
