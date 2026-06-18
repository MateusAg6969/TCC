'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { ApiSuccess, PalavraFiltro } from '@/types';

export default function WordFilterManager() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<PalavraFiltro[]>([]);
  const [novoTermo, setNovoTermo] = useState('');
  const [loading, setLoading] = useState(true);

  // Derivamos este flag para centralizar a regra de exibicao do painel.
  const podeGerenciarFiltro = useMemo(() => {
    return Boolean(token && user?.mod_voluntario);
  }, [token, user?.mod_voluntario]);

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  async function carregar() {
    if (!podeGerenciarFiltro) return;

    setLoading(true);
    try {
      const response = await api.get<ApiSuccess<PalavraFiltro[]>>('/filtro-palavras', {
        headers: authHeaders,
      });
      setItems(response.data.data || []);
    } catch {
      toast.error('Sem permissão para listar termos. Acesso de moderador necessário.');
    } finally {
      setLoading(false);
    }
  }

  async function adicionarTermo() {
    if (!podeGerenciarFiltro || !novoTermo.trim()) return;

    setLoading(true);
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
      toast.success('Termo adicionado com sucesso.');
      await carregar();
    } catch {
      toast.error('Não foi possível adicionar este termo.');
    } finally {
      setLoading(false);
    }
  }

  async function removerTermo(id: string) {
    if (!podeGerenciarFiltro) return;

    setLoading(true);
    try {
      await api.delete(`/filtro-palavras/${id}`, { headers: authHeaders });
      toast.success('Termo removido com sucesso.');
      await carregar();
    } catch {
      toast.error('Falha ao remover termo.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
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
        }
      } catch {
        if (ativo) {
          toast.error('Erro ao carregar filtros de palavras.');
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
          aria-label="Atualizar lista de termos"
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
          aria-label="Salvar novo termo"
          className="rounded-xl px-4 py-2 text-sm font-semibold text-[#2D1B2D]"
          style={{ backgroundColor: '#8F9972' }}
        >
          Salvar
        </button>
      </div>

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
              aria-label={`Remover termo "${item.termo}"`}
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
