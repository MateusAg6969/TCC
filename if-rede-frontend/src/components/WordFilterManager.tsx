'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { ApiSuccess, PalavraFiltro } from '@/types';

type Status = {
  ok: boolean;
  message: string;
} | null;

export default function WordFilterManager() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<PalavraFiltro[]>([]);
  const [novoTermo, setNovoTermo] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>(null);

  // Derivamos este flag para centralizar a regra de exibicao do painel.
  // Entrada: estado de sessao (token) + perfil do usuario autenticado.
  // Saida: boolean que decide se o componente pode renderizar UI administrativa.
  const podeGerenciarFiltro = useMemo(() => {
    return Boolean(token && user?.mod_voluntario);
  }, [token, user?.mod_voluntario]);

  // Montamos os headers de autenticacao uma unica vez por mudanca de token.
  // Entrada: token JWT vindo do contexto.
  // Saida: objeto padrao de headers para chamadas autenticadas no backend.
  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  async function carregar() {
    // Esta funcao sincroniza a lista de palavras com a API.
    // Entrada: credencial JWT no header Authorization.
    // Saida: atualizacao de itens na interface e mensagem de status.
    if (!podeGerenciarFiltro) return;

    setLoading(true);
    setStatus(null);

    try {
      const response = await api.get<ApiSuccess<PalavraFiltro[]>>('/filtro-palavras', {
        headers: authHeaders,
      });
      setItems(response.data.data || []);
    } catch {
      setStatus({
        ok: false,
        message: 'Sem permissao para listar termos. Acesso de moderador necessario.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function adicionarTermo() {
    // Esta acao envia um novo termo para persistencia no backend.
    // Entrada: texto digitado no campo + token de moderador.
    // Saida: termo salvo na base e recarga da lista na tela.
    if (!podeGerenciarFiltro || !novoTermo.trim()) return;

    setLoading(true);
    setStatus(null);

    try {
      await api.post(
        '/filtro-palavras',
        {
          termo: novoTermo.trim(),
          severidade: 'media',
          ativo: true,
        },
        { headers: authHeaders }
      );

      setNovoTermo('');
      setStatus({ ok: true, message: 'Termo adicionado com sucesso.' });
      await carregar();
    } catch {
      setStatus({ ok: false, message: 'Nao foi possivel adicionar este termo.' });
    } finally {
      setLoading(false);
    }
  }

  async function removerTermo(id: string) {
    // Esta acao remove um termo existente pelo ID da colecao.
    // Entrada: identificador do documento selecionado na UI.
    // Saida: exclusao no backend e atualizacao da listagem local.
    if (!podeGerenciarFiltro) return;

    setLoading(true);
    setStatus(null);

    try {
      await api.delete(`/filtro-palavras/${id}`, { headers: authHeaders });
      setStatus({ ok: true, message: 'Termo removido com sucesso.' });
      await carregar();
    } catch {
      setStatus({ ok: false, message: 'Falha ao remover termo.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Evitamos setState sincrono no efeito para cumprir as regras de hooks.
    // Entrada: mudanca de permissao (token/moderador).
    // Saida: lista carregada apenas quando usuario tem acesso.
    let ativo = true;

    async function carregarInicial() {
      if (!podeGerenciarFiltro) {
        if (ativo) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.get<ApiSuccess<PalavraFiltro[]>>('/filtro-palavras', {
          headers: authHeaders,
        });

        if (ativo) {
          setItems(response.data.data || []);
          setStatus(null);
        }
      } catch {
        if (ativo) {
          setStatus({
            ok: false,
            message: 'Sem permissao para listar termos. Acesso de moderador necessario.',
          });
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarInicial();

    return () => {
      ativo = false;
    };
  }, [authHeaders, podeGerenciarFiltro]);

  if (!podeGerenciarFiltro) {
    return null;
  }

  return (
    <section
      className="rounded-3xl border p-4"
      style={{
        backgroundColor: '#2D1B2D',
        borderColor: '#8F9972',
      }}
    >
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8F9972]">
          Filtro de palavras
        </h3>
        <button
          type="button"
          onClick={carregar}
          disabled={loading}
          className="rounded-full border px-3 py-1 text-xs text-white"
          style={{ borderColor: '#8F9972' }}
        >
          Atualizar
        </button>
      </header>

      <div className="mb-3 flex gap-2">
        <input
          value={novoTermo}
          onChange={(event) => setNovoTermo(event.target.value)}
          placeholder="Adicionar termo proibido"
          className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm text-white outline-none"
          style={{ borderColor: '#8F9972' }}
        />
        <button
          type="button"
          onClick={adicionarTermo}
          disabled={loading || !novoTermo.trim()}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-[#2D1B2D]"
          style={{ backgroundColor: '#8F9972' }}
        >
          Salvar
        </button>
      </div>

      {status && (
        <p className={`mb-2 text-xs ${status.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
          {status.message}
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item._id} className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-white">{item.termo}</p>
              <p className="text-xs text-white/70">Severidade: {item.severidade}</p>
            </div>
            <button
              type="button"
              onClick={() => removerTermo(item._id)}
              className="rounded-full border border-rose-400 px-3 py-1 text-xs text-rose-300"
              disabled={loading}
            >
              Remover
            </button>
          </li>
        ))}
        {!items.length && !loading && (
          <li className="rounded-xl bg-black/20 px-3 py-2 text-xs text-white/70">
            Nenhum termo customizado cadastrado.
          </li>
        )}
      </ul>
    </section>
  );
}
