'use client';

import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * COMPONENTE: USER SKELETON
 * O que faz: Mimetiza a estrutura dos resultados de usuários na busca.
 */

export default function UserSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-if-card border border-white/5 shadow-sm">
      <Skeleton width={48} height={48} borderRadius={12} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
      <div className="flex-1">
        <Skeleton width="60%" height={14} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
        <Skeleton width="40%" height={10} className="mt-1" baseColor="#3D2B3D" highlightColor="#4D3B4D" />
      </div>
      <Skeleton width={16} height={16} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
    </div>
  );
}
