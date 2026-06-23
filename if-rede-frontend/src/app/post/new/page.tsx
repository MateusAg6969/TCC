'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import CustomSelect from '@/components/CustomSelect';
import type { ApiSuccess, TagSubtipo } from '@/types';

type FormState = {
  titulo: string;
  descricao: string;
  tipo: 'texto' | 'imagem' | 'audio' | 'video';
  texto_longo: string;
  subtipo_tag_id: string;
};

export default function NewPostPage() {
  const router = useRouter();
  const { token } = useAuth();

  // Estado unico do formulario para manter todo o payload em uma fonte de verdade.
  // Entrada: interacoes dos campos pelo usuario.
  // Saida: objeto serializavel para enviar no POST /postagens.
  const [form, setForm] = useState<FormState>({
    titulo: '',
    descricao: '',
    tipo: 'texto',
    texto_longo: '',
    subtipo_tag_id: '',
  });

  // Arquivo binario selecionado para upload multipart.
  // Entrada: input type=file do usuario.
  // Saida: objeto File enviado ao backend via FormData.
  const [arquivo, setArquivo] = useState<File | null>(null);

  // Catalogo de tags por tipo para classificar subtipo da postagem.
  // Entrada: resposta da API /tags/subtipos?tipo=...
  // Saida: opcoes renderizadas no select.
  const [tags, setTags] = useState<TagSubtipo[]>([]);

  // Campos da solicitacao de nova tag quando a opcao desejada nao existir.
  const [novaTagNome, setNovaTagNome] = useState('');
  const [novaTagJustificativa, setNovaTagJustificativa] = useState('');

  // Flags de UX para comunicar progresso e erros sem recarregar a pagina.
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);


  // Atualiza qualquer campo textual mantendo o estado imutavel.
  // Entrada: nome do campo + valor digitado.
  // Saida: novo estado refletido imediatamente na interface.
  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    // O que faz: carrega tags de subtipo correspondentes ao tipo selecionado.
    // Por que: evita mostrar tags de categorias incompatíveis (ex.: fotografia para audio).
    // Fluxo de dados: tipo do formulario -> GET /tags/subtipos -> estado tags -> select de opcoes.
    let ativo = true;

    async function carregarTags() {
      if (!token) return;

      try {
        const response = await api.get<ApiSuccess<TagSubtipo[]>>(`/tags/subtipos?tipo=${form.tipo}`);

        if (!ativo) return;

        const lista = response.data?.data || [];
        setTags(lista);

        // Mantem selecionada apenas tag valida para o tipo atual.
        if (!lista.find((item) => item._id === form.subtipo_tag_id)) {
          setForm((prev) => ({ ...prev, subtipo_tag_id: '' }));
        }
      } catch {
        if (!ativo) return;
        setTags([]);

        // O que faz: informa falha de carregamento do catalogo de tags.
        // Por que: sem feedback, o usuario entende que "nao existem tags" em vez de erro de integracao.
        // Fluxo de dados: erro de requisicao -> estado de status -> mensagem visivel no formulario.
        setStatus({
          ok: false,
          message: 'Nao foi possivel carregar as tags agora. Verifique a sessao e tente novamente.',
        });
      }
    }

    carregarTags();

    return () => {
      ativo = false;
    };
  }, [form.tipo, form.subtipo_tag_id, token]);

  async function solicitarNovaTag() {
    // O que faz: envia pedido de criacao de tag para moderacao.
    // Por que: o usuario pode nao encontrar subtipo desejado no catalogo atual.
    // Fluxo de dados: campos do formulario de solicitacao -> POST /tags/solicitacoes -> resposta de status.
    if (!token) {
      setStatus({ ok: false, message: 'Sessao expirada. Faca login novamente.' });
      return;
    }

    if (!novaTagNome.trim()) {
      setStatus({ ok: false, message: 'Informe o nome da nova tag desejada.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await api.post(
        '/tags/solicitacoes',
        {
          nome_sugerido: novaTagNome.trim(),
          tipo: form.tipo,
          justificativa: novaTagJustificativa.trim(),
        }
      );

      setNovaTagNome('');
      setNovaTagJustificativa('');
      setStatus({ ok: true, message: 'Solicitacao enviada. A equipe vai avaliar sua nova tag.' });
    } catch {
      setStatus({ ok: false, message: 'Nao foi possivel enviar a solicitacao da tag agora.' });
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    // Guarda de seguranca: a rota e protegida no middleware, mas a validacao local
    // evita envio acidental sem token caso o estado de sessao seja perdido no client.
    if (!token) {
      setStatus({ ok: false, message: 'Sessao expirada. Faca login novamente.' });
      return;
    }

    // Validacao minima para manter o contrato da API e reduzir respostas 400.
    if (!form.titulo.trim()) {
      setStatus({ ok: false, message: 'Informe um titulo para a postagem.' });
      return;
    }

    if (!arquivo) {
      setStatus({ ok: false, message: 'Selecione um arquivo para publicar.' });
      return;
    }

    if (arquivo.size > 25 * 1024 * 1024) {
      setStatus({ ok: false, message: `Arquivo excede o limite unificado de 25MB.` });
      return;
    }

    setLoading(true);

    try {
      // Montagem multipart para suportar binario + campos textuais no mesmo request.
      // Entrada: estado do formulario + arquivo selecionado.
      // Saida: FormData serializada para endpoint de criacao de post.
      const payload = new FormData();
      payload.append('titulo', form.titulo.trim());
      payload.append('descricao', form.descricao.trim());
      payload.append('tipo', form.tipo);
      payload.append('texto_longo', form.tipo === 'texto' ? form.texto_longo.trim() : '');
      payload.append('subtipo_tag_id', form.subtipo_tag_id || '');
      payload.append('arquivo', arquivo);

      await api.post('/postagens', payload);

      setStatus({ ok: true, message: 'Postagem publicada com sucesso.' });

      // Navegacao apos sucesso: retorna ao feed para feedback imediato de publicacao.
      router.push('/home');
      router.refresh();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Nao foi possivel publicar agora. Tente novamente.';
      setStatus({ ok: false, message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-if-bg text-if-text">
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <header className="mb-6 flex items-center justify-between rounded-main bg-if-card p-4">
          {/*
            Botao de retorno rapido para manter navegacao previsivel.
            Fluxo: clique -> /home sem depender do historico do navegador.
          */}
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-full border border-if-olive px-4 py-2 text-sm font-semibold text-if-olive"
          >
            <ArrowLeft size={16} /> Voltar
          </Link>
          <h1 className="text-lg font-semibold">Nova postagem</h1>
        </header>

        <form onSubmit={onSubmit} className="space-y-4 rounded-main bg-if-card p-6">
          <label className="block text-sm">
            Titulo
            <input
              value={form.titulo}
              onChange={(event) => updateField('titulo', event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
              placeholder="Digite um titulo para sua postagem"
            />
          </label>

          <label className="block text-sm">
            Descricao
            <textarea
              value={form.descricao}
              onChange={(event) => updateField('descricao', event.target.value)}
              className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
              placeholder="Descreva brevemente o conteudo"
            />
          </label>

          <label className="block text-sm relative z-20">
            Tipo de postagem
            <CustomSelect
              options={[
                { value: 'texto', label: 'Texto' },
                { value: 'imagem', label: 'Imagem' },
                { value: 'audio', label: 'Áudio' },
                { value: 'video', label: 'Vídeo' }
              ]}
              value={form.tipo}
              onChange={(val) => updateField('tipo', val as FormState['tipo'])}
              placeholder="Selecione o tipo..."
            />
          </label>

          <label className="block text-sm relative z-10">
            Subtipo (tag)
            <CustomSelect
              options={tags.map((tag) => ({ value: tag._id, label: tag.nome }))}
              value={form.subtipo_tag_id}
              onChange={(val) => updateField('subtipo_tag_id', val)}
              placeholder="Selecione uma tag"
            />
          </label>

          {form.tipo === 'texto' && (
            <label className="block text-sm">
              Descricao textual opcional
              <textarea
                value={form.texto_longo}
                onChange={(event) => updateField('texto_longo', event.target.value)}
                className="mt-2 min-h-36 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                placeholder="Resumo do arquivo textual (opcional)"
              />
            </label>
          )}

          <label className="block text-sm">
            Arquivo da postagem (limite: 25MB)
            <input
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setArquivo(file);
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
            />
          </label>

          <div className="rounded-xl border border-dashed border-if-olive/60 bg-black/20 p-4">
            <p className="text-sm font-semibold text-if-olive">Nao encontrou a tag que queria?</p>
            <p className="mt-1 text-xs text-if-text/70">
              Envie uma solicitacao para adicionar um novo subtipo ao catalogo.
            </p>

            <div className="mt-3 space-y-2">
              <input
                value={novaTagNome}
                onChange={(event) => setNovaTagNome(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                placeholder="Ex.: fotografia analogica"
              />
              <textarea
                value={novaTagJustificativa}
                onChange={(event) => setNovaTagJustificativa(event.target.value)}
                className="min-h-20 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                placeholder="Explique rapidamente por que essa tag e importante (opcional)"
              />

              <button
                type="button"
                onClick={solicitarNovaTag}
                disabled={loading}
                className="rounded-full border border-if-olive px-4 py-2 text-sm font-semibold text-if-olive disabled:opacity-60"
              >
                Solicitar nova tag
              </button>
            </div>
          </div>

          {status && (
            <p className={`text-sm ${status.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-if-olive px-5 py-3 font-semibold text-if-bg disabled:opacity-60"
          >
            <Send size={16} /> {loading ? 'Publicando...' : 'Publicar'}
          </button>
        </form>
      </div>
    </main>
  );
}
