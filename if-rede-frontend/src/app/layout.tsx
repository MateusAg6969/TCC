import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IF REDE",
  description: "Rede social acadêmica do IFC",
};

import { House } from "lucide-react";
import Link from "next/link";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-if-bg text-if-text">
        <Providers>
          {/* 
            Botão Global de Início
            O que faz: garante que o usuário sempre possa retornar à Home.
            Por que: exigência de usabilidade para evitar que o usuário se sinta "preso" em páginas internas.
          */}
          <Link 
            href="/home" 
            className="fixed bottom-6 left-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-if-olive text-if-bg shadow-2xl hover:scale-110 active:scale-95 transition-all md:top-6 md:bottom-auto"
            title="Página Inicial"
          >
            <House size={28} />
          </Link>
          {children}
        </Providers>
      </body>
    </html>
  );
}
