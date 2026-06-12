'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, ExternalLink, Loader2 } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import Link from 'next/link';
import { Notificacao } from '@/types';

/**
 * ============================================================================
 * COMPONENTE: NOTIFICATION BELL (v3.0 - Estética IF REDE)
 * ============================================================================
 * O que faz: Exibe alerta de notificações com painel dropdown estilizado.
 * Estilo: Paleta Roxo/Oliva, Dark Mode (bg-if-card), animações e transparências.
 */

export default function NotificationBell() {
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { 
    notificacoes, 
    naoLidas, 
    marcarComoLida, 
    deletarNotificacao, 
    marcarTudasComoLidas,
    lidarComCliqueNotificacao 
  } = useNotifications();

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMostrarDropdown(false);
      }
    }

    if (mostrarDropdown) {
      document.addEventListener('mousedown', handleClickFora);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, [mostrarDropdown]);

  const formatarData = (data: string) => {
    const agora = new Date();
    const notificacao = new Date(data);
    const diff = Math.floor((agora.getTime() - notificacao.getTime()) / 1000);

    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  };

  const obterIconeTipo = (tipo: string) => {
    const tipos: Record<string, string> = {
      like: '❤️',
      comentario: '💬',
      seguidor: '👥',
      repost: '🔄',
      tag: '🏷️',
      resposta: '↩️',
    };
    return tipos[tipo] || '🔔';
  };

  const aoClicarNotificacao = (notificacao: Notificacao) => {
    lidarComCliqueNotificacao(notificacao);
    setMostrarDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setMostrarDropdown(!mostrarDropdown)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-if-text transition-all hover:bg-if-purple hover:text-white active:scale-90 group"
        title="Notificações"
      >
        <Bell 
          size={20} 
          className={`transition-all duration-300 ${
            naoLidas > 0 
              ? 'text-if-purple fill-if-purple/10' 
              : 'text-gray-400 group-hover:text-white'
          }`} 
        />

        {naoLidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-if-olive text-[10px] font-black text-if-bg shadow-lg animate-bounce">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {/* Dropdown de notificações - Estética IF REDE */}
      {mostrarDropdown && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-if-card border border-white/10 rounded-3xl shadow-2xl z-[120] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Cabeçalho */}
          <div className="bg-gradient-to-r from-if-purple/20 to-transparent border-b border-white/5 p-5 flex items-center justify-between">
            <div>
              <h3 className="font-black text-if-purple text-sm uppercase tracking-widest">Notificações</h3>
              {naoLidas > 0 ? (
                <p className="text-[10px] text-if-text/40 font-bold mt-0.5 uppercase">
                  {naoLidas} novas atualizações acadêmicas
                </p>
              ) : (
                <p className="text-[10px] text-if-text/30 mt-0.5 font-bold uppercase">Você está em dia!</p>
              )}
            </div>
            {naoLidas > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  marcarTudasComoLidas();
                }}
                className="text-[10px] font-black text-if-olive hover:underline uppercase tracking-tighter"
              >
                Limpar tudo
              </button>
            )}
          </div>

          {/* Lista de notificações */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
            {notificacoes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-if-text/10">
                  <Bell size={32} />
                </div>
                <p className="text-sm font-bold text-if-text/40 italic">Nenhuma notificação nova no momento.</p>
              </div>
            ) : (
              notificacoes.map((notificacao) => (
                <div
                  key={notificacao._id}
                  onClick={() => aoClicarNotificacao(notificacao)}
                  className={`group relative flex gap-4 p-4 transition-all hover:bg-white/5 cursor-pointer ${
                    !notificacao.lida ? 'bg-if-purple/5' : ''
                  }`}
                >
                  {!notificacao.lida && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-if-olive" />
                  )}

                  {/* Ícone */}
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-if-purple/20 flex items-center justify-center text-if-purple font-black shadow-inner group-hover:scale-110 transition-transform">
                    {obterIconeTipo(notificacao.tipo)}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-if-text/90 leading-snug">
                      <span className="font-black text-if-purple">
                        {notificacao.ator_id?.perfil?.nome || 'Usuário'}
                      </span>{' '}
                      {notificacao.mensagem}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-[10px] font-bold text-if-text/30 uppercase tracking-tighter">
                        {formatarData(notificacao.criada_em)}
                      </p>
                      {!notificacao.lida && (
                        <span className="text-[9px] bg-if-olive text-if-bg px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                          Nova
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botões de ação rápida */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletarNotificacao(notificacao._id);
                      }}
                      className="p-2 rounded-lg bg-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/20 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé */}
          <footer className="bg-black/20 p-4 border-t border-white/5">
            <Link
              href="/notificacoes"
              className="flex items-center justify-center gap-2 text-xs font-black text-if-text/50 transition-all hover:text-if-purple uppercase tracking-widest"
              onClick={() => setMostrarDropdown(false)}
            >
              Ver Central de Alertas
              <ExternalLink size={12} />
            </Link>
          </footer>
        </div>
      )}
    </div>
  );
}
