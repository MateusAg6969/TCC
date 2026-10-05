/**
 * ============================================================================
 * CONFIGURAÇÃO GLOBAL DO NEXT.JS (next.config.ts)
 * ============================================================================
 * O que faz: Configurações do compilador Next.js, domínios de imagens remotas
 * e otimizações de build para o ambiente Vercel.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração de imagens para permitir Cloudinary e mídias externas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
