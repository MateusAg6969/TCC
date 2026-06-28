'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/api';

interface ImageCarouselProps {
  images: Array<{ url: string }>;
  titulo: string;
  aspectClass?: string;
  objectFitClass?: string;
  className?: string;
}

export default function ImageCarousel({
  images,
  titulo,
  aspectClass = 'aspect-[16/10]',
  objectFitClass = 'object-cover',
  className = ''
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Se for só uma imagem, renderiza ela normalmente (ou se o array for vazio)
  if (!images || images.length === 0) return null;
  if (images.length === 1) {
    return (
      <div className={`relative w-full ${aspectClass} ${className}`}>
        <Image
          src={resolveAssetUrl(images[0].url)}
          alt={titulo}
          fill
          className={`${objectFitClass} transition-transform duration-500 group-hover:scale-110`}
          unoptimized
        />
      </div>
    );
  }

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * index;
    scrollRef.current.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentIndex < images.length - 1) scrollTo(currentIndex + 1);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentIndex > 0) scrollTo(currentIndex - 1);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.clientWidth;
    // Calcula o índice atual baseado no scroll (arredondando)
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <div className={`relative w-full overflow-hidden group/carousel ${className}`}>
      {/* Container de Scroll */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-full w-full"
      >
        {images.map((img, i) => (
          <div key={i} className={`relative w-full flex-none snap-center ${aspectClass}`}>
            <Image
              src={resolveAssetUrl(img.url)}
              alt={`${titulo} - Imagem ${i + 1}`}
              fill
              className={objectFitClass}
              unoptimized
            />
          </div>
        ))}
      </div>

      {/* Botões de Navegação */}
      {currentIndex > 0 && (
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 transition-opacity group-hover/carousel:opacity-100 hover:bg-black/70 shadow-lg border border-white/10"
          aria-label="Imagem anterior"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 transition-opacity group-hover/carousel:opacity-100 hover:bg-black/70 shadow-lg border border-white/10"
          aria-label="Próxima imagem"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Indicadores (Bolinhas) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/30 px-3 py-2 rounded-full backdrop-blur-md pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 border border-white/5">
        {images.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex 
                ? 'w-3 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
                : 'w-1.5 bg-white/50'
            }`} 
          />
        ))}
      </div>
      
      {/* Etiqueta de Contagem no topo */}
      <div className="absolute top-3 right-3 z-20 bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-md pointer-events-none border border-white/10 opacity-0 group-hover/carousel:opacity-100 transition-opacity">
        <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
          {currentIndex + 1} <span className="text-white/50">/</span> <span className="text-if-purple">{images.length}</span>
        </p>
      </div>
    </div>
  );
}
