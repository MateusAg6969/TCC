'use client';

import { useEffect, useState } from 'react';
import { Users, Loader2, RefreshCcw, Home, Shield, ShieldOff, Ban, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ConfirmModal';

interface UserData {
  _id: string;
  perfil: {
    nome: string;
    email: string;
    status_vinculo: string;
  };
  configuracoes: {
    mod_voluntario: boolean;
    admin: boolean;
  };
  ativo: boolean;
  suspenso_ate: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [unsuspendUserId, setUnsuspendUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !user.admin)) {
      router.push('/home'); 
    }
  }, [user, loading, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'mod', value: boolean) => {
    setProcessingId(userId);
    try {
      const payload = newRole === 'admin' ? { admin: value } : { mod_voluntario: value };
      await api.patch(`/admin/users/${userId}/role`, payload);
      
      setUsers(prev => prev.map(u => {
        if (u._id === userId) {
          return {
            ...u,
            configuracoes: {
              ...u.configuracoes,
              [newRole === 'admin' ? 'admin' : 'mod_voluntario']: value
            }
          };
        }
        return u;
      }));
    } catch (error) {
      toast.error('Erro ao alterar privilégios.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSuspend = async (userId: string) => {
    const diasStr = window.prompt('Quantos dias de suspensão? (ex: 7)');
    if (!diasStr) return;
    const dias = parseInt(diasStr);
    if (isNaN(dias) || dias <= 0) return toast.error('Quantidade de dias inválida.');

    const motivo = window.prompt('Qual o motivo da suspensão? (opcional)');

    setProcessingId(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/suspend`, { dias, motivo });
      const newSuspensoAte = res.data.data.suspenso_ate;
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, suspenso_ate: newSuspensoAte } : u));
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao suspender usuário.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnsuspend = async (userId: string) => {
    setUnsuspendUserId(null);
    setProcessingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/unsuspend`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, suspenso_ate: null } : u));
      toast.success('Suspensão removida.');
    } catch (error) {
      toast.error('Erro ao remover suspensão.');
    } finally {
      setProcessingId(null);
    }
  };

  const isSuspended = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) > new Date();
  };

  if (loading && users.length === 0) {
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
              <Users size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">Gestão de Usuários</h1>
              <p className="text-if-text/40 font-bold uppercase text-[10px] tracking-widest">Painel Administrativo Root</p>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={fetchUsers}
               className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all active:scale-95"
             >
               <RefreshCcw size={18} /> Atualizar Lista
             </button>
             <Link 
               href="/home"
               className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-if-purple text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-if-purple/20"
             >
               <Home size={18} /> Voltar ao Feed
             </Link>
          </div>
        </header>

        {/* Tabela de Usuários */}
        <section className="bg-if-card border border-white/5 rounded-3xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-sm font-bold text-if-text/60">
                  <th className="p-4 pl-6">Nome / Email</th>
                  <th className="p-4">Vínculo</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Permissões</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const suspended = isSuspended(u.suspenso_ate);
                  const isProcessing = processingId === u._id;
                  
                  return (
                    <tr key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-if-text">{u.perfil.nome}</div>
                        <div className="text-xs text-if-text/50">{u.perfil.email}</div>
                      </td>
                      <td className="p-4 text-sm font-medium capitalize text-if-text/80">
                        {u.perfil.status_vinculo}
                      </td>
                      <td className="p-4">
                        {suspended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold">
                            <Ban size={12} /> Suspenso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                            <CheckCircle size={12} /> Ativo
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {u.configuracoes.admin && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-if-purple/20 text-if-purple text-xs font-bold border border-if-purple/30">
                              <Shield size={12} /> Admin
                            </span>
                          )}
                          {u.configuracoes.mod_voluntario && !u.configuracoes.admin && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold border border-blue-500/20">
                              <Shield size={12} /> Mod
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {isProcessing ? (
                            <Loader2 className="animate-spin text-if-text/50" size={18} />
                          ) : (
                            <>
                              <button
                                onClick={() => handleRoleChange(u._id, 'admin', !u.configuracoes.admin)}
                                disabled={u._id === user?.id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${u.configuracoes.admin ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-if-purple/10 text-if-purple border-if-purple/20 hover:bg-if-purple/20'}`}
                                title={u.configuracoes.admin ? "Remover privilégios de Admin" : "Promover a Admin"}
                              >
                                {u.configuracoes.admin ? '- Admin' : '+ Admin'}
                              </button>
                              
                              {!u.configuracoes.admin && (
                                <button
                                  onClick={() => handleRoleChange(u._id, 'mod', !u.configuracoes.mod_voluntario)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${u.configuracoes.mod_voluntario ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20'}`}
                                >
                                  {u.configuracoes.mod_voluntario ? '- Mod' : '+ Mod'}
                                </button>
                              )}

                              {suspended ? (
                                <button
                                  onClick={() => setUnsuspendUserId(u._id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                >
                                  Desbloquear
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSuspend(u._id)}
                                  disabled={u.configuracoes.admin}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-30"
                                >
                                  Suspender
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ConfirmModal 
        isOpen={!!unsuspendUserId}
        title="Remover Suspensão"
        message="Deseja realmente remover a suspensão deste usuário? Ele poderá interagir na rede novamente."
        confirmText="Desbloquear"
        isDestructive={false}
        onConfirm={() => {
          if (unsuspendUserId) handleUnsuspend(unsuspendUserId);
        }}
        onCancel={() => setUnsuspendUserId(null)}
      />
    </main>
  );
}
