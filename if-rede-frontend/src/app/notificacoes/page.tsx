'use client';

import Link from 'next/link';
import { ArrowLeft, Trash2, Check } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  } = useNotifications();

  const [filtro, setFiltro] = useState('all');
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    buscarNotificacoes(pagina, filtro);
  }, [pagina, filtro]);

  const formatarData = (data) => {
    const agora = new Date();
    const notificacao = new Date(data);
    const diff = Math.floor((agora - notificacao) / 1000);

    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const obterIconeTipo = (tipo) => {
    const tipos = {
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
        {/* Cabeçalho */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-if-purple hover:underline mb-4"
          >
            <ArrowLeft size={18} /> Voltar
          </button>
          <h1 className="text-3xl font-bold">Notificações</h1>
          <p className="text-if-text/70 mt-1">
            {naoLidas > 0
              ? `Você tem ${naoLidas} notificação${naoLidas !== 1 ? 's' : ''} não lida${naoLidas !== 1 ? 's' : ''}`
              : 'Você está em dia com as notificações'}
          </p>
        </div>

        {/* Controles */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFiltro('all');
                setPagina(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filtro === 'all'
                  ? 'bg-if-purple text-white'
                  : 'bg-if-card text-if-text hover:bg-if-purple/20'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => {
                setFiltro('nao-lidas');
                setPagina(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filtro === 'nao-lidas'
                  ? 'bg-if-purple text-white'
                  : 'bg-if-card text-if-text hover:bg-if-purple/20'
              }`}
            >
              Não lidas
            </button>
          </div>

          {naoLidas > 0 && (
            <button
              onClick={() => marcarTudasComoLidas()}
              className="ml-auto flex items-center gap-2 text-if-purple hover:underline text-sm font-medium"
            >
              <Check size={16} /> Marcar tudo lido
            </button>
          )}

          {notificacoes.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Tem certeza? Todas as notificações serão deletadas.')) {
                  deletarTodasNotificacoes();
                }
              }}
              className="flex items-center gap-2 text-red-500 hover:underline text-sm font-medium"
            >
              <Trash2 size={16} /> Deletar tudo
            </button>
          )}
        </div>

        {/* Lista de notificações */}
        <div className="rounded-main bg-if-card divide-y divide-if-purple divide-opacity-10 overflow-hidden">
          {carregando ? (
            <div className="p-8 text-center text-if-text/50">Carregando...</div>
          ) : notificacoesFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-if-text/70">
                {filtro === 'nao-lidas'
                  ? 'Parabéns! Você leu todas as notificações'
                  : 'Nenhuma notificação ainda'}
              </p>
            </div>
          ) : (
            notificacoesFiltradas.map((notificacao) => (
              <div
                key={notificacao._id}
                className={`p-4 hover:bg-if-purple hover:bg-opacity-5 transition-colors ${
                  !notificacao.lida ? 'bg-if-purple bg-opacity-5' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Ícone */}
                  <span className="text-2xl mt-1">{obterIconeTipo(notificacao.tipo)}</span>

                  {/* Conteúdo */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-if-text">
                          <span className="font-semibold">
                            {notificacao.ator_id?.perfil?.nome || 'Usuário'}
                          </span>{' '}
                          {notificacao.mensagem}
                        </p>
                        <p className="text-sm text-if-text/70 mt-1">
                          {formatarData(notificacao.criada_em)}
                        </p>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex items-center gap-2 ml-4">
                        {!notificacao.lida && (
                          <button
                            onClick={() => marcarComoLida(notificacao._id)}
                            className="p-2 text-if-purple hover:bg-if-purple/20 rounded transition-colors"
                            title="Marcar como lida"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => deletarNotificacao(notificacao._id)}
                          className="p-2 text-red-500 hover:bg-red-500/20 rounded transition-colors"
                          title="Deletar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé */}
        {notificacoes.length > 0 && (
          <div className="mt-6 text-center text-if-text/70 text-sm">
            Mostrando {notificacoesFiltradas.length} de {notificacoes.length} notificações
          </div>
        )}
      </div>
    </main>
  );
}
