'use client';

import Link from 'next/link';
import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, UploadCloud, X, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const capaInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    titulo: '',
    descricao: '',
    tipo: 'texto',
    texto_longo: '',
    subtipo_tag_id: '',
  });

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [capa, setCapa] = useState<File | null>(null);
  const [tags, setTags] = useState<TagSubtipo[]>([]);
  
  const [showTagForm, setShowTagForm] = useState(false);
  const [novaTagNome, setNovaTagNome] = useState('');
  const [novaTagJustificativa, setNovaTagJustificativa] = useState('');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    let ativo = true;

    async function carregarTags() {
      if (!token) return;

      try {
        const response = await api.get<ApiSuccess<TagSubtipo[]>>(`/tags/subtipos?tipo=${form.tipo}`);
        if (!ativo) return;

        const lista = response.data?.data || [];
        setTags(lista);

        if (!lista.find((item) => item._id === form.subtipo_tag_id)) {
          setForm((prev) => ({ ...prev, subtipo_tag_id: '' }));
        }
      } catch {
        if (!ativo) return;
        setTags([]);
        setStatus({
          ok: false,
          message: 'Não foi possível carregar as tags agora. Verifique a sessão e tente novamente.',
        });
      }
    }

    carregarTags();
    return () => {
      ativo = false;
    };
  }, [form.tipo, form.subtipo_tag_id, token]);

  async function solicitarNovaTag() {
    if (!token) {
      setStatus({ ok: false, message: 'Sessão expirada. Faça login novamente.' });
      return;
    }

    if (!novaTagNome.trim()) {
      setStatus({ ok: false, message: 'Informe o nome da nova tag desejada.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await api.post('/tags/solicitacoes', {
        nome_sugerido: novaTagNome.trim(),
        tipo: form.tipo,
        justificativa: novaTagJustificativa.trim(),
      });

      setNovaTagNome('');
      setNovaTagJustificativa('');
      setShowTagForm(false);
      setStatus({ ok: true, message: 'Solicitação enviada. A equipe vai avaliar sua nova tag.' });
    } catch {
      setStatus({ ok: false, message: 'Não foi possível enviar a solicitação da tag agora.' });
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (!token) {
      setStatus({ ok: false, message: 'Sessão expirada. Faça login novamente.' });
      return;
    }

    if (!form.titulo.trim()) {
      setStatus({ ok: false, message: 'Informe um título para a postagem.' });
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
      const payload = new FormData();
      payload.append('titulo', form.titulo.trim());
      payload.append('descricao', form.descricao.trim());
      payload.append('tipo', form.tipo);
      payload.append('texto_longo', form.tipo === 'texto' ? form.texto_longo.trim() : '');
      payload.append('subtipo_tag_id', form.subtipo_tag_id || '');
      payload.append('arquivo', arquivo);
      if (capa) {
        payload.append('capa', capa);
      }

      await api.post('/postagens', payload);

      setStatus({ ok: true, message: 'Postagem publicada com sucesso.' });
      router.push('/home');
      router.refresh();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Não foi possível publicar agora. Tente novamente.';
      setStatus({ ok: false, message: msg });
    } finally {
      setLoading(false);
    }
  }

  // Helper para lidar com arquivos no drag and drop ou click
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) setArquivo(file);
  };

  return (
    <main className="min-h-screen bg-if-bg text-if-text pb-20">
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/home"
            className="group flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-if-text/70 transition-all hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Voltar
          </Link>
          <h1 className="flex items-center gap-2 text-lg font-bold text-if-olive">
            <Sparkles size={20} /> Nova Publicação
          </h1>
        </header>

        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          
          {/* COLUNA ESQUERDA - CONTEÚDO PRINCIPAL */}
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl bg-if-card/50 backdrop-blur-md border border-white/5 p-6 md:p-8 shadow-2xl">
              <input
                value={form.titulo}
                onChange={(event) => updateField('titulo', event.target.value)}
                className="w-full bg-transparent text-3xl md:text-5xl font-black text-white outline-none placeholder:text-white/20 transition-all focus:placeholder:opacity-0"
                placeholder="Título da sua obra..."
              />
              <div className="mt-6">
                <textarea
                  value={form.descricao}
                  onChange={(event) => updateField('descricao', event.target.value)}
                  className="w-full min-h-[120px] resize-none bg-transparent text-lg md:text-xl text-if-text/80 outline-none placeholder:text-white/20"
                  placeholder="Conte-nos um pouco sobre o que você criou..."
                />
              </div>

              <AnimatePresence>
                {form.tipo === 'texto' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="overflow-hidden"
                  >
                    <label className="mb-2 block text-sm font-bold text-if-olive">Texto Completo</label>
                    <textarea
                      value={form.texto_longo}
                      onChange={(event) => updateField('texto_longo', event.target.value)}
                      className="w-full min-h-[300px] rounded-2xl bg-black/30 p-5 text-base text-if-text outline-none border border-white/5 focus:border-if-olive/50 transition-colors custom-scrollbar"
                      placeholder="Escreva sua redação, artigo ou poema completo aqui..."
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* COLUNA DIREITA - OPÇÕES E UPLOAD */}
          <div className="flex flex-col gap-6">
            
            {/* AREA DE UPLOAD */}
            <div className="rounded-3xl bg-if-card/50 backdrop-blur-md border border-white/5 p-6 shadow-2xl">
              <label className="mb-3 block text-sm font-bold text-if-text/80">Arquivo da Postagem</label>
              
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => !arquivo && fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center w-full min-h-[200px] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
                  ${arquivo ? 'border-if-olive bg-if-olive/5' : 'border-white/20 hover:border-if-olive hover:bg-if-olive/5'}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setArquivo(e.target.files[0]);
                  }}
                />
                
                <AnimatePresence mode="wait">
                  {arquivo ? (
                    <motion.div 
                      key="file"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex flex-col items-center p-6 text-center"
                    >
                      <div className="h-16 w-16 rounded-2xl bg-if-olive/20 text-if-olive flex items-center justify-center mb-4">
                        <UploadCloud size={32} />
                      </div>
                      <p className="font-bold text-white line-clamp-1 break-all px-4">{arquivo.name}</p>
                      <p className="mt-1 text-xs text-if-text/50">{(arquivo.size / 1024 / 1024).toFixed(2)} MB</p>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setArquivo(null);
                        }}
                        className="mt-6 rounded-full bg-red-500/20 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                      >
                        <X size={14} /> Remover arquivo
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex flex-col items-center p-6 text-center"
                    >
                      <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/50 group-hover:text-if-olive group-hover:bg-if-olive/10 transition-all">
                        <UploadCloud size={32} />
                      </div>
                      <p className="font-bold text-white">Clique ou Arraste um arquivo</p>
                      <p className="mt-1 text-xs text-if-text/50">Até 25MB (Imagens, Vídeos, Áudios ou PDFs)</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* AREA DE UPLOAD DA CAPA */}
            <div className="rounded-3xl bg-if-card/50 backdrop-blur-md border border-white/5 p-6 shadow-2xl">
              <label className="mb-3 block text-sm font-bold text-if-text/80">Capa da Postagem (Opcional)</label>
              
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) setCapa(file);
                }}
                onClick={() => !capa && capaInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center w-full min-h-[160px] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
                  ${capa ? 'border-if-purple bg-if-purple/5' : 'border-white/20 hover:border-if-purple hover:bg-if-purple/5'}`}
              >
                <input
                  type="file"
                  ref={capaInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setCapa(e.target.files[0]);
                  }}
                />
                
                <AnimatePresence mode="wait">
                  {capa ? (
                    <motion.div 
                      key="capa-file"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex flex-col items-center p-4 text-center"
                    >
                      <div className="h-12 w-12 rounded-xl bg-if-purple/20 text-if-purple flex items-center justify-center mb-2">
                        <UploadCloud size={24} />
                      </div>
                      <p className="font-bold text-white text-sm line-clamp-1 break-all px-4">{capa.name}</p>
                      <p className="mt-1 text-[10px] text-if-text/50">{(capa.size / 1024 / 1024).toFixed(2)} MB</p>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCapa(null);
                        }}
                        className="mt-4 rounded-full bg-red-500/20 px-3 py-1.5 text-[10px] font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1"
                      >
                        <X size={12} /> Remover capa
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="capa-empty"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex flex-col items-center p-4 text-center"
                    >
                      <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-2 text-white/50 group-hover:text-if-purple group-hover:bg-if-purple/10 transition-all">
                        <UploadCloud size={24} />
                      </div>
                      <p className="font-bold text-white text-sm">Adicionar capa personalizada</p>
                      <p className="mt-1 text-[10px] text-if-text/50">Apenas imagens (até 5MB)</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* SELETORES */}
            <div className="rounded-3xl bg-if-card/50 backdrop-blur-md border border-white/5 p-6 shadow-2xl space-y-5">
              <label className="block text-sm relative z-20">
                <span className="font-bold text-if-text/80">Categoria Principal</span>
                <CustomSelect
                  options={[
                    { value: 'texto', label: '📖 Texto Literário' },
                    { value: 'imagem', label: '🎨 Arte Visual' },
                    { value: 'audio', label: '🎧 Produção Sonora' },
                    { value: 'video', label: '🎬 Produção Audiovisual' }
                  ]}
                  value={form.tipo}
                  onChange={(val) => updateField('tipo', val as FormState['tipo'])}
                  placeholder="Selecione o tipo..."
                />
              </label>

              <label className="block text-sm relative z-10">
                <span className="font-bold text-if-text/80">Especificação (Tag)</span>
                <CustomSelect
                  options={tags.map((tag) => ({ value: tag._id, label: tag.nome }))}
                  value={form.subtipo_tag_id}
                  onChange={(val) => updateField('subtipo_tag_id', val)}
                  placeholder="Selecione uma tag"
                />
              </label>

              {/* AREA DE NOVA TAG */}
              <div className="pt-2">
                {!showTagForm ? (
                  <button
                    type="button"
                    onClick={() => setShowTagForm(true)}
                    className="flex items-center gap-2 text-xs font-bold text-if-olive hover:text-if-olive/80 transition-colors"
                  >
                    <Plus size={14} /> Não encontrou a tag ideal? Solicitar nova.
                  </button>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-dashed border-if-olive/40 bg-if-olive/5 p-4 mt-2">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-sm font-bold text-if-olive">Solicitar Tag</p>
                          <button type="button" onClick={() => setShowTagForm(false)} className="text-white/40 hover:text-white"><X size={14}/></button>
                        </div>
                        
                        <div className="space-y-3">
                          <input
                            value={novaTagNome}
                            onChange={(event) => setNovaTagNome(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-if-olive/50"
                            placeholder="Ex.: Fotografia analógica"
                          />
                          <textarea
                            value={novaTagJustificativa}
                            onChange={(event) => setNovaTagJustificativa(event.target.value)}
                            className="min-h-16 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-if-olive/50"
                            placeholder="Por que precisamos dessa tag?"
                          />
                          <button
                            type="button"
                            onClick={solicitarNovaTag}
                            disabled={loading}
                            className="w-full rounded-xl bg-if-olive/20 px-4 py-2 text-sm font-bold text-if-olive hover:bg-if-olive hover:text-white transition-all disabled:opacity-50"
                          >
                            Enviar Solicitação
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>

            {status && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`text-sm text-center font-bold px-4 py-3 rounded-2xl ${status.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
              >
                {status.message}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-if-olive/10 border border-if-olive/20 py-4 text-base font-black text-if-olive hover:bg-if-olive hover:text-if-bg active:scale-95 transition-all shadow-[0_0_40px_rgba(182,240,152,0.1)] hover:shadow-[0_0_40px_rgba(182,240,152,0.3)] disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <Send size={18} /> {loading ? 'Publicando sua obra...' : 'Publicar Postagem'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
