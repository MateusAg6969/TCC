'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import Link from 'next/link';
import { Notificacao } from '@/types';

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
    const diff = Math.floor((agora.getTime() - notificacao.getTime()) / 1000); // segundos

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
        className="relative p-2 text-if-text hover:bg-if-purple hover:bg-opacity-10 rounded-lg transition-all duration-200 active:scale-95"
        title="Notificações"
      >
        <Bell size={24} className={`${naoLidas > 0 ? 'text-if-purple animate-pulse' : 'text-gray-500'}`} />

        {/* Badge de notificações não lidas */}
        {naoLidas > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {mostrarDropdown && (
        <div className="absolute right-0 mt-3 w-96 bg-white border border-if-purple border-opacity-20 rounded-xl shadow-2xl z-50 max-h-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Cabeçalho */}
          <div className="bg-white border-b border-if-purple border-opacity-10 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-if-text text-lg">Notificações</h3>
              {naoLidas > 0 && (
                <p className="text-xs text-if-purple font-medium">{naoLidas} nova(s) notificação(ões)</p>
              )}
            </div>
            {naoLidas > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  marcarTudasComoLidas();
                }}
                className="text-xs text-if-purple hover:text-if-purple-dark hover:underline font-bold transition-colors"
              >
                Marcar tudo lido
              </button>
            )}
          </div>

          {/* Lista de notificações */}
          <div className="overflow-y-auto flex-1 divide-y divide-if-purple divide-opacity-5">
            {notificacoes.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell size={32} className="opacity-20" />
                </div>
                <p className="font-medium">Você está em dia!</p>
                <p className="text-sm opacity-60">Nenhuma notificação por enquanto.</p>
              </div>
            ) : (
              notificacoes.map((notificacao) => (
                <div
                  key={notificacao._id}
                  onClick={() => aoClicarNotificacao(notificacao)}
                  className={`group p-4 hover:bg-if-purple hover:bg-opacity-[0.03] transition-all cursor-pointer relative ${
                    !notificacao.lida ? 'bg-if-purple bg-opacity-[0.02]' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Indicador de não lida */}
                    {!notificacao.lida && (
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-if-purple rounded-full"></span>
                    )}

                    {/* Ícone do tipo */}
                    <div className="bg-gray-50 w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                      {obterIconeTipo(notificacao.tipo)}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-if-text leading-snug">
                            <span className="font-bold hover:underline">
                              {notificacao.ator_id?.perfil?.nome || 'Usuário'}
                            </span>{' '}
                            {notificacao.mensagem}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-400 font-medium">
                              {formatarData(notificacao.criada_em)}
                            </p>
                            {!notificacao.lida && (
                              <span className="text-[10px] bg-if-purple bg-opacity-10 text-if-purple px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Nova
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botões de ação rápida */}
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletarNotificacao(notificacao._id);
                            }}
                            className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                            title="Remover"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Botão marcar como lida e ir */}
                      {!notificacao.lida && (
                        <div className="mt-2 flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              marcarComoLida(notificacao._id);
                            }}
                            className="text-[11px] text-if-purple hover:text-if-purple-dark font-bold flex items-center gap-1 transition-colors"
                          >
                            <Check size={12} />
                            Marcar como lida
                          </button>
                          <span className="text-[11px] text-gray-300 flex items-center gap-1">
                            <ExternalLink size={10} />
                            Ver detalhes
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé com link para página completa */}
          {notificacoes.length > 0 && (
            <div className="bg-gray-50 p-3 text-center border-t border-if-purple border-opacity-5">
              <Link
                href="/notificacoes"
                className="text-sm text-if-purple hover:text-if-purple-dark font-bold flex items-center justify-center gap-2 transition-colors"
                onClick={() => setMostrarDropdown(false)}
              >
                Ver todas as notificações
                <ExternalLink size={14} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
