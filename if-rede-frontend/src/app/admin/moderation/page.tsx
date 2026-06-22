'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Loader2, CheckCircle, RefreshCcw, Home } from 'lucide-react';
import api from '@/lib/api';
import { Post } from '@/types';
import ModerationCard from '@/components/ModerationCard';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * ============================================================================
 * PÁGINA: CENTRAL DE MODERAÇÃO (ADMIN)
 * ============================================================================
 * O que faz: Gerencia a fila de conteúdos pendentes de análise humana.
 * Segurança: Protegida por verificação de role (servidor/mod_voluntario).
 */
export default function ModerationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Verificação de Segurança (Frontend)
  // O que faz: Redireciona usuários não autorizados.
  useEffect(() => {
    if (!loading && (!user || !user.mod_voluntario)) {
       // O backend já barra, mas o frontend melhora a UX
       // router.push('/home'); 
    }
  }, [user, loading, router]);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/moderation/pending');
      setPosts(res.data.data || []);
    } catch (error) {
      console.error('Erro ao buscar fila:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (postId: string) => {
    setProcessingId(postId);
    try {
      await api.patch(`/admin/moderation/posts/${postId}/approve`);
      // Atualização de Estado Instantânea (Feedback Dinâmico)
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Postagem aprovada com sucesso.');
    } catch (error) {
      toast.error('Erro ao aprovar postagem. Tente novamente.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (postId: string) => {
    const motivo = prompt('Por favor, informe o motivo da rejeição (opcional):');
    setProcessingId(postId);
    try {
      await api.patch(`/admin/moderation/posts/${postId}/reject`, { motivo });
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Postagem rejeitada.');
    } catch (error) {
      toast.error('Erro ao rejeitar postagem.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
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
            <div className="h-16 w-16 rounded-3xl bg-if-purple/10 flex items-center justify-center text-if-purple border border-if-purple/20">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">Central de Moderação</h1>
              <p className="text-if-text/40 font-bold uppercase text-[10px] tracking-widest">Painel Administrativo Acadêmico</p>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={fetchPending}
               className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all active:scale-95"
             >
               <RefreshCcw size={18} /> Atualizar Fila
             </button>
             <Link 
               href="/home"
               className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-if-purple text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-if-purple/20"
             >
               <Home size={18} /> Voltar ao Feed
             </Link>
          </div>
        </header>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="bg-if-card/50 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
              <span className="font-bold text-if-text/40">Pendentes</span>
              <span className="text-2xl font-black text-amber-500">{posts.length}</span>
           </div>
           {/* Placeholder para outras stats */}
        </div>

        {/* Fila de Moderação */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          {posts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <ModerationCard
                  key={post._id}
                  post={post}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isProcessing={processingId === post._id}
                />
              ))}
            </div>
          ) : (
            /* Estado Vazio (Empty State) */
            <div className="rounded-[40px] bg-if-card/30 p-20 text-center border-2 border-dashed border-white/5">
              <div className="bg-emerald-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500 border border-emerald-500/20">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-2xl font-black text-if-text mb-4">Excelente Trabalho!</h2>
              <p className="max-w-md mx-auto text-if-text/50 font-medium italic leading-relaxed">
                Nenhuma postagem pendente de moderação no momento. A comunidade acadêmica está operando dentro das diretrizes.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
