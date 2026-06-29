'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Loader2, 
  Home, 
  Shield, 
  ArrowLeft, 
  ToggleLeft, 
  ToggleRight, 
  AlertTriangle 
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { PalavraFiltro } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminWordsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [words, setWords] = useState<PalavraFiltro[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingWord, setAddingWord] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newSeverity, setNewSeverity] = useState<'baixa' | 'media' | 'alta'>('media');
  const [deleteWordId, setDeleteWordId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Segurança no Frontend
  useEffect(() => {
    if (!authLoading && (!user || (!user.admin && !user.mod_voluntario))) {
      router.push('/home');
    }
  }, [user, authLoading, router]);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/filtro-palavras');
      setWords(res.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar palavras proibidas:', error);
      toast.error('Erro ao carregar filtro de palavras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchWords();
    }
  }, [user, authLoading]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await api.patch(`/filtro-palavras/${id}`, { ativo: !currentStatus });
      setWords(prev => prev.map(w => w._id === id ? { ...w, ativo: res.data.data.ativo } : w));
      toast.success(res.data.data.ativo ? 'Termo reativado no filtro.' : 'Termo desativado temporariamente.');
    } catch (error) {
      toast.error('Erro ao alterar status do termo.');
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim()) return toast.error('O termo não pode estar em branco.');

    try {
      setSubmitting(true);
      const res = await api.post('/filtro-palavras', {
        termo: newTerm.trim(),
        severidade: newSeverity,
      });
      
      setWords(prev => [res.data.data, ...prev]);
      setNewTerm('');
      setNewSeverity('media');
      setAddingWord(false);
      toast.success('Termo adicionado com sucesso ao filtro.');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao adicionar palavra ao filtro.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWord = async () => {
    if (!deleteWordId) return;

    try {
      await api.delete(`/filtro-palavras/${deleteWordId}`);
      setWords(prev => prev.filter(w => w._id !== deleteWordId));
      toast.success('Termo removido definitivamente do filtro.');
    } catch (error) {
      toast.error('Erro ao remover termo.');
    } finally {
      setDeleteWordId(null);
    }
  };

  if (authLoading || (!user || (!user.admin && !user.mod_voluntario))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-if-bg">
        <Loader2 className="animate-spin text-if-purple" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-if-bg text-if-text p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header do Painel */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-if-card p-8 rounded-[40px] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin"
              className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-if-text/60 hover:text-white border border-white/5 transition-all active:scale-95"
              title="Voltar ao Painel"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <FileText className="text-if-purple" size={24} />
                <h1 className="text-3xl font-black tracking-tighter">Filtro de Palavras</h1>
              </div>
              <p className="text-if-text/40 font-bold uppercase text-[10px] tracking-widest">Controle de Conteúdo Inadequado</p>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={() => setAddingWord(true)}
               className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-if-purple text-white hover:brightness-110 font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-if-purple/20 text-sm"
             >
               <Plus size={18} /> Adicionar Termo
             </button>
             <Link 
               href="/home"
               className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all active:scale-95 text-sm"
             >
               <Home size={18} /> Feed
             </Link>
          </div>
        </header>

        {/* Modal de Adicionar Palavra */}
        {addingWord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-if-card border border-white/10 rounded-[32px] p-8 shadow-2xl animate-in scale-in duration-300">
              <h3 className="text-2xl font-black text-white mb-6">Bloquear Novo Termo</h3>
              
              <form onSubmit={handleAddWord} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-if-text/50 uppercase tracking-wider mb-2">Palavra ou Frase</label>
                  <input
                    type="text"
                    required
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    placeholder="Ex: palavrao, ofensivo, etc."
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/5 text-white font-bold placeholder:text-if-text/20 focus:border-if-purple focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-if-text/50 uppercase tracking-wider mb-2">Grau de Severidade</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['baixa', 'media', 'alta'] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setNewSeverity(sev)}
                        className={`py-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                          newSeverity === sev 
                            ? 'bg-if-purple text-white border-if-purple shadow-lg shadow-if-purple/20' 
                            : 'bg-white/5 border-white/5 text-if-text/60 hover:bg-white/10'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingWord(false);
                      setNewTerm('');
                    }}
                    className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-4 rounded-2xl bg-if-purple text-white font-bold transition-all hover:brightness-110 disabled:opacity-50 text-sm shadow-xl shadow-if-purple/10"
                  >
                    {submitting ? 'Salvando...' : 'Adicionar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabela de Termos */}
        <section className="bg-if-card border border-white/5 rounded-3xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          {loading ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="animate-spin text-if-purple" size={32} />
            </div>
          ) : words.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5 text-sm font-bold text-if-text/60">
                    <th className="p-4 pl-8">Termo / Palavra</th>
                    <th className="p-4">Severidade</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-8 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {words.map((w) => (
                    <tr key={w._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 pl-8">
                        <div className="font-bold text-white text-base">{w.termo}</div>
                        <div className="text-xs text-if-text/40">Normalizado: {w.termo_normalizado}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${
                          w.severidade === 'alta' 
                            ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                            : w.severidade === 'media'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                        }`}>
                          {w.severidade}
                        </span>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleToggleActive(w._id, w.ativo)}
                          className="flex items-center gap-1.5 text-if-text/60 hover:text-white transition-colors"
                          title={w.ativo ? "Desativar termo" : "Reativar termo"}
                        >
                          {w.ativo ? (
                            <>
                              <ToggleRight className="text-emerald-500" size={24} />
                              <span className="text-xs font-bold text-emerald-500">Ativo</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="text-if-text/30" size={24} />
                              <span className="text-xs font-bold text-if-text/30">Inativo</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4 pr-8">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setDeleteWordId(w._id)}
                            className="h-9 w-9 rounded-xl bg-red-500/10 text-red-500 border border-red-500/10 hover:bg-red-500/20 hover:border-red-500/20 flex items-center justify-center transition-all active:scale-90"
                            title="Remover termo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-[40px] bg-if-card/30 p-20 text-center">
              <div className="bg-if-purple/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-if-purple border border-if-purple/20">
                <AlertTriangle size={36} />
              </div>
              <h2 className="text-xl font-black text-white mb-2">Nenhum termo cadastrado</h2>
              <p className="max-w-md mx-auto text-if-text/40 text-sm font-medium leading-relaxed mb-6">
                O filtro de publicações está vazio. As postagens serão criadas livremente sem análise automática por palavras banidas.
              </p>
              <button 
                onClick={() => setAddingWord(true)}
                className="px-6 py-3 rounded-2xl bg-if-purple text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-if-purple/20 text-xs"
              >
                Adicionar Primeiro Termo
              </button>
            </div>
          )}
        </section>
      </div>

      <ConfirmModal 
        isOpen={!!deleteWordId}
        title="Excluir Termo"
        message="Tem certeza que deseja remover este termo do filtro? Ele deixará de ser monitorado e as publicações com ele serão permitidas."
        confirmText="Excluir"
        isDestructive={true}
        onConfirm={handleDeleteWord}
        onCancel={() => setDeleteWordId(null)}
      />
    </main>
  );
}
