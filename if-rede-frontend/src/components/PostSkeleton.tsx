'use client';

import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * COMPONENTE: POST SKELETON
 * O que faz: Mimetiza a estrutura do PostCard para evitar Layout Shift (CLS).
 * Estética: Cores adaptadas para o Dark Mode do IF REDE.
 */

export default function PostSkeleton() {
  return (
    <div className="overflow-hidden rounded-main bg-if-card border border-if-purple/10 p-0 shadow-card">
      <header className="p-4 flex items-center justify-between border-b border-if-purple/5">
        <div className="flex items-center gap-3">
          <Skeleton circle width={40} height={40} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
          <div>
            <Skeleton width={120} height={14} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
            <Skeleton width={80} height={10} className="mt-1" baseColor="#3D2B3D" highlightColor="#4D3B4D" />
          </div>
        </div>
        <Skeleton width={60} height={20} borderRadius={20} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
      </header>

      <div className="p-4">
        {/* Simula uma imagem ou texto longo */}
        <Skeleton height={200} borderRadius={16} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
        <div className="mt-4 space-y-2">
          <Skeleton width="90%" height={12} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
          <Skeleton width="70%" height={12} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
        </div>
      </div>

      <footer className="bg-if-purple/5 p-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Skeleton width={40} height={20} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
          <Skeleton width={40} height={20} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
          <Skeleton width={40} height={20} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
        </div>
        <Skeleton width={100} height={10} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
      </footer>
    </div>
  );
}
