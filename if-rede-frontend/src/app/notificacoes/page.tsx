'use client';

import Link from 'next/link';
import { ArrowLeft, Trash2, Check, Bell } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';

/**
 * ============================================================================
 * PÁGINA: NOTIFICAÇÕES (Versão v2.0 - Identidade IF REDE)
 * ============================================================================
 * O que faz: Lista todas as notificações do usuário com filtros e ações em massa.
 * Justificativa: Centraliza a gestão de interações sociais para o usuário.
 * Identidade: Uso de tons Roxo (IF) e Oliva para uma estética acadêmica moderna.
 */

export default function NotificacoesPage() {
  const router = useRouter();
  const {
    notificacoes,
    naoLidas,
    carregando,
    buscarNotificacoes,
    marcarComoLida,
    deletarNotificacao,
    marcarTudasComoLidas,
    deletarTodasNotificacoes,
    lidarComCliqueNotificacao,
  } = useNotifications();

  const [filtro, setFiltro] = useState('all');
  const [pagina, setPagina] = useState(1);
  const [showClearModal, setShowClearModal] = useState(false);

  // Efeito: Recarrega as notificações sempre que o filtro ou página mudar.
  useEffect(() => {
    buscarNotificacoes(pagina, filtro);
  }, [pagina, filtro, buscarNotificacoes]);

  const formatarData = (data: string) => {
    const agora = new Date();
    const notificacao = new Date(data);
    const diff = Math.floor((agora.getTime() - notificacao.getTime()) / 1000);

    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
    return new Date(data).toLocaleDateString('pt-BR');
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

  const notificacoesFiltradas =
    filtro === 'nao-lidas' ? notificacoes.filter((n) => !n.lida) : notificacoes;

  return (
    <main className="min-h-screen bg-if-bg text-if-text">
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        {/* Cabeçalho de Navegação */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            aria-label="Voltar para o Feed"
            className="flex items-center gap-2 text-if-purple hover:bg-if-purple/10 px-3 py-1.5 rounded-full transition-all mb-6 font-bold text-sm"
          >
            <ArrowLeft size={18} /> Voltar para o Feed
          </button>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-if-text">Notificações</h1>
              <p className="text-if-text/60 mt-2 font-medium">
                {naoLidas > 0
                  ? `Você tem ${naoLidas} atualização${naoLidas !== 1 ? 'ões' : 'ão'} pendente${naoLidas !== 1 ? 's' : ''}`
                  : 'Sua caixa de entrada está organizada.'}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Ferramentas e Filtros */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 bg-white p-2 rounded-[1.5rem] shadow-sm border border-if-purple/5">
          <div className="flex gap-1">
            <button
              onClick={() => {
                setFiltro('all');
                setPagina(1);
              }}
              className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                filtro === 'all'
                  ? 'bg-if-purple text-white shadow-lg shadow-if-purple/20'
                  : 'bg-transparent text-if-text/60 hover:bg-if-purple/5'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => {
                setFiltro('nao-lidas');
                setPagina(1);
              }}
              className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                filtro === 'nao-lidas'
                  ? 'bg-if-purple text-white shadow-lg shadow-if-purple/20'
                  : 'bg-transparent text-if-text/60 hover:bg-if-purple/5'
              }`}
            >
              Não lidas
            </button>
          </div>

          <div className="flex items-center gap-4 px-2">
            {naoLidas > 0 && (
              <button
                onClick={() => marcarTudasComoLidas()}
                className="flex items-center gap-2 text-if-purple hover:text-if-purple-dark text-sm font-bold transition-colors"
              >
                <Check size={18} /> Marcar tudo lido
              </button>
            )}

            {notificacoes.length > 0 && (
              <button
                onClick={() => setShowClearModal(true)}
                className="flex items-center gap-2 text-red-400 hover:text-red-600 text-sm font-bold transition-colors"
              >
                <Trash2 size={18} /> Limpar histórico
              </button>
            )}
          </div>
        </div>

        {/* Lista de notificações - Estética IF REDE */}
        <div className="rounded-[2.5rem] bg-if-card border border-if-purple/10 shadow-2xl divide-y divide-if-purple/5 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
          {carregando ? (
            <div className="p-20 text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-if-purple border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-6 text-if-text/50 font-bold tracking-widest uppercase text-xs">Sincronizando...</p>
            </div>
          ) : notificacoesFiltradas.length === 0 ? (
            <div className="p-20 text-center">
              <div className="bg-if-purple/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                <Bell size={48} className="text-if-purple/20" />
              </div>
              <h2 className="text-2xl font-black text-if-text mb-3">Silêncio acadêmico...</h2>
              <p className="text-if-text/50 max-w-sm mx-auto font-medium">
                {filtro === 'nao-lidas'
                  ? 'Você já processou todas as suas notificações recentes. Ótimo trabalho!'
                  : 'Nenhuma atividade registrada por enquanto. Explore o feed para interagir!'}
              </p>
              <Link 
                href="/home" 
                className="inline-block mt-8 bg-if-olive text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition-all active:scale-95"
              >
                Explorar o Feed
              </Link>
            </div>
          ) : (
            notificacoesFiltradas.map((notificacao) => (
              <div
                key={notificacao._id}
                onClick={() => lidarComCliqueNotificacao(notificacao)}
                className={`p-8 transition-all duration-500 relative group cursor-pointer ${
                  !notificacao.lida 
                    ? 'bg-gradient-to-r from-if-purple/[0.04] to-transparent' 
                    : 'hover:bg-gray-50/50'
                }`}
              >
                {!notificacao.lida && (
                  <div className="absolute left-0 top-4 bottom-4 w-1.5 bg-if-purple rounded-r-full shadow-[0_0_10px_rgba(110,68,255,0.4)]"></div>
                )}
                
                <div className="flex items-start gap-6">
                  {/* Ícone com Avatar Placeholder */}
                  <div className={`shrink-0 w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-3xl shadow-sm border transition-transform group-hover:scale-105 duration-300 ${
                    !notificacao.lida 
                      ? 'bg-white border-if-purple/20 text-if-purple' 
                      : 'bg-gray-100 border-transparent text-gray-400'
                  }`}>
                    {obterIconeTipo(notificacao.tipo)}
                  </div>

                  {/* Conteúdo da Notificação */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <p className="text-if-text text-xl leading-snug">
                          {/* 
                              NAVEGAÇÃO DE PERFIL: 
                              O que faz: Transforma o nome do ator em um link dinâmico.
                              Justificativa: Permite que o usuário conheça quem interagiu com ele instantaneamente.
                              Fluxo: Clique -> /profile/[username]
                          */}
                          <Link 
                            href={`/profile/${notificacao.ator_id?.perfil?.nome || 'usuario'}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-black text-if-purple hover:underline cursor-pointer transition-all"
                          >
                            {notificacao.ator_id?.perfil?.nome || 'Usuário'}
                          </Link>{' '}
                          <span className="font-medium text-if-text/80">{notificacao.mensagem}</span>
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            {formatarData(notificacao.criada_em)}
                          </p>
                          {!notificacao.lida && (
                            <span className="flex items-center gap-1.5 bg-if-purple/10 text-if-purple text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                              <span className="h-1.5 w-1.5 rounded-full bg-if-purple animate-ping"></span>
                              Nova
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações Rápidas */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                        {!notificacao.lida && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              marcarComoLida(notificacao._id);
                            }}
                            className="p-3 text-if-purple hover:bg-if-purple hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-90"
                            title="Marcar como lida"
                          >
                            <Check size={22} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletarNotificacao(notificacao._id);
                          }}
                          className="p-3 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-90"
                          title="Excluir"
                        >
                          <Trash2 size={22} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginação / Rodapé Informativo */}
        {notificacoes.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Mostrando {notificacoesFiltradas.length} de {notificacoes.length} notificações registradas
            </p>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={showClearModal}
        title="Limpar Histórico"
        message="Tem certeza que deseja apagar todas as notificações? Esta ação não pode ser desfeita."
        confirmText="Limpar Tudo"
        onConfirm={() => {
          deletarTodasNotificacoes();
          setShowClearModal(false);
        }}
        onCancel={() => setShowClearModal(false)}
      />
    </main>
  );
}
