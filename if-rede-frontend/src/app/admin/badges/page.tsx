'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Award, 
  Plus, 
  Trash2, 
  Loader2, 
  Home, 
  ArrowLeft, 
  Image as ImageIcon 
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Medalha } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminBadgesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [badges, setBadges] = useState<Medalha[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [iconeUrl, setIconeUrl] = useState('');
  const [deleteBadgeId, setDeleteBadgeId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Segurança de acesso
  useEffect(() => {
    if (!authLoading && (!user || (!user.admin && !user.mod_voluntario))) {
      router.push('/home');
    }
  }, [user, authLoading, router]);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const res = await api.get('/medalhas');
      setBadges(res.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar medalhas:', error);
      toast.error('Erro ao carregar lista de medalhas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchBadges();
    }
  }, [user, authLoading]);

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !descricao.trim() || !iconeUrl.trim()) {
      return toast.error('Preencha todos os campos obrigatórios.');
    }

    try {
      setSubmitting(true);
      const res = await api.post('/medalhas', {
        nome: nome.trim(),
        descricao: descricao.trim(),
        icone_url: iconeUrl.trim()
      });
      setBadges(prev => [...prev, res.data.data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNome('');
      setDescricao('');
      setIconeUrl('');
      setCreating(false);
      toast.success('Medalha acadêmica criada com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao criar medalha.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBadge = async () => {
    if (!deleteBadgeId) return;

    try {
      await api.delete(`/medalhas/${deleteBadgeId}`);
      setBadges(prev => prev.filter(b => b._id !== deleteBadgeId));
      toast.success('Medalha excluída permanentemente.');
    } catch (error) {
      toast.error('Erro ao excluir medalha.');
    } finally {
      setDeleteBadgeId(null);
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
                <Award className="text-if-purple" size={24} />
                <h1 className="text-3xl font-black tracking-tighter">Gerenciador de Medalhas</h1>
              </div>
              <p className="text-if-text/40 font-bold uppercase text-[10px] tracking-widest">Catálogo de Conquistas Acadêmicas</p>
            </div>
          </div>
          
          <div className="flex gap-3">
             {user.admin && (
               <button 
                 onClick={() => setCreating(true)}
                 className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-if-purple text-white hover:brightness-110 font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-if-purple/20 text-sm"
               >
                 <Plus size={18} /> Criar Medalha
               </button>
             )}
             <Link 
               href="/home"
               className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all active:scale-95 text-sm"
             >
               <Home size={18} /> Feed
             </Link>
          </div>
        </header>

        {/* Modal de Criação de Medalha */}
        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-if-card border border-white/10 rounded-[32px] p-8 shadow-2xl animate-in scale-in duration-300">
              <h3 className="text-2xl font-black text-white mb-6">Criar Medalha do Sistema</h3>
              
              <form onSubmit={handleCreateBadge} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-if-text/50 uppercase tracking-wider mb-2">Nome da Medalha</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Aluno Destaque, Monitor, etc."
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/5 text-white font-bold placeholder:text-if-text/20 focus:border-if-purple focus:outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-if-text/50 uppercase tracking-wider mb-2">Descrição</label>
                  <textarea
                    required
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Explique o critério para conquistar esta medalha..."
                    rows={3}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/5 text-white font-semibold placeholder:text-if-text/20 focus:border-if-purple focus:outline-none transition-all text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-if-text/50 uppercase tracking-wider mb-2">URL do Ícone (Emoji ou Imagem)</label>
                  <input
                    type="url"
                    required
                    value={iconeUrl}
                    onChange={(e) => setIconeUrl(e.target.value)}
                    placeholder="https://cdn-icons-png.flaticon.com/..."
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/5 text-white font-bold placeholder:text-if-text/20 focus:border-if-purple focus:outline-none transition-all text-sm"
                  />
                </div>

                {iconeUrl.trim() && (
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-if-bg flex items-center justify-center border border-white/5 shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={iconeUrl} alt="Preview" className="h-8 w-8 object-contain" onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
                      }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Pré-visualização do Ícone</p>
                      <p className="text-[10px] text-if-text/40">Garante que a imagem carregue corretamente.</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setNome('');
                      setDescricao('');
                      setIconeUrl('');
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
                    {submitting ? 'Criando...' : 'Criar Medalha'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Grade de Medalhas */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          {loading ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="animate-spin text-if-purple" size={32} />
            </div>
          ) : badges.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((b) => (
                <div 
                  key={b._id}
                  className="group bg-if-card/70 hover:bg-if-card border border-white/5 rounded-[32px] p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-all">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={b.icone_url} 
                        alt={b.nome} 
                        className="h-10 w-10 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white group-hover:text-if-purple transition-colors mb-1">{b.nome}</h3>
                      <p className="text-xs text-if-text/60 leading-relaxed font-semibold">{b.descricao}</p>
                    </div>
                  </div>

                  {user.admin && (
                    <div className="flex justify-end mt-6 pt-4 border-t border-white/5">
                      <button
                        onClick={() => setDeleteBadgeId(b._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-all border border-red-500/10 active:scale-95"
                        title="Deletar medalha do sistema"
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[40px] bg-if-card/30 p-20 text-center border-2 border-dashed border-white/5">
              <div className="bg-if-purple/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-if-purple border border-if-purple/20">
                <Award size={36} />
              </div>
              <h2 className="text-xl font-black text-white mb-2">Nenhuma medalha cadastrada</h2>
              <p className="max-w-md mx-auto text-if-text/40 text-sm font-medium leading-relaxed mb-6">
                Não existem medalhas definidas no sistema. A gamificação está inativa no momento.
              </p>
              {user.admin && (
                <button 
                  onClick={() => setCreating(true)}
                  className="px-6 py-3 rounded-2xl bg-if-purple text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-if-purple/20 text-xs"
                >
                  Criar Primeira Medalha
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      <ConfirmModal 
        isOpen={!!deleteBadgeId}
        title="Excluir Medalha"
        message="Tem certeza que deseja excluir esta medalha? Ela será removida de todos os perfis dos usuários que já a conquistaram."
        confirmText="Excluir"
        isDestructive={true}
        onConfirm={handleDeleteBadge}
        onCancel={() => setDeleteBadgeId(null)}
      />
    </main>
  );
}
