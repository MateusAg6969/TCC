'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Loader2, 
  RefreshCcw, 
  Home, 
  Shield, 
  Ban, 
  CheckCircle, 
  Trash2, 
  Award, 
  X, 
  Plus, 
  ArrowLeft 
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ConfirmModal';
import { Medalha } from '@/types';

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
  
  // Modais de controle
  const [unsuspendUserId, setUnsuspendUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [badgeUserId, setBadgeUserId] = useState<string | null>(null);
  
  // Gamificação / Medalhas
  const [userBadges, setUserBadges] = useState<Medalha[]>([]);
  const [allBadges, setAllBadges] = useState<Medalha[]>([]);
  const [loadingUserBadges, setLoadingUserBadges] = useState(false);

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
      toast.error('Erro ao listar usuários.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBadges = async () => {
    try {
      const res = await api.get('/medalhas');
      setAllBadges(res.data.data || []);
    } catch (error) {
      console.error('Erro ao buscar medalhas globais:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAllBadges();
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
      toast.success('Permissões do usuário atualizadas com sucesso.');
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
      toast.success(`Usuário suspenso por ${dias} dias.`);
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

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    setProcessingId(deleteUserId);
    try {
      await api.delete(`/admin/users/${deleteUserId}`);
      setUsers(prev => prev.filter(u => u._id !== deleteUserId));
      toast.success('Usuário e todos os dados associados foram excluídos com sucesso.');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao excluir usuário.');
    } finally {
      setProcessingId(null);
      setDeleteUserId(null);
    }
  };

  // Funções de Gerenciamento de Medalhas para o Usuário
  const fetchUserBadges = async (userId: string) => {
    try {
      setLoadingUserBadges(true);
      const res = await api.get(`/medalhas/usuario/${userId}`);
      setUserBadges(res.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar medalhas do usuário:', error);
      toast.error('Erro ao carregar medalhas do usuário.');
    } finally {
      setLoadingUserBadges(false);
    }
  };

  const handleOpenBadgeManager = (userId: string) => {
    setBadgeUserId(userId);
    fetchUserBadges(userId);
  };

  const handleAssignBadge = async (badgeId: string) => {
    if (!badgeUserId) return;
    try {
      await api.post(`/medalhas/${badgeId}/atribuir/${badgeUserId}`);
      toast.success('Medalha atribuída com sucesso!');
      fetchUserBadges(badgeUserId);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao atribuir medalha.');
    }
  };

  const handleRemoveBadge = async (badgeId: string) => {
    if (!badgeUserId) return;
    try {
      await api.delete(`/medalhas/${badgeId}/remover/${badgeUserId}`);
      toast.success('Medalha removida do usuário.');
      fetchUserBadges(badgeUserId);
    } catch (error) {
      toast.error('Erro ao remover medalha.');
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

  // Filtrar medalhas disponíveis para atribuir (que o usuário ainda não possui)
  const availableBadges = allBadges.filter(
    ab => !userBadges.some(ub => ub._id === ab._id)
  );

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
                <Users className="text-if-purple" size={24} />
                <h1 className="text-3xl font-black tracking-tighter">Gestão de Usuários</h1>
              </div>
              <p className="text-if-text/40 font-bold uppercase text-[10px] tracking-widest">Painel Administrativo Root</p>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={fetchUsers}
               className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all active:scale-95 text-sm"
             >
               <RefreshCcw size={18} /> Atualizar Lista
             </button>
             <Link 
               href="/home"
               className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-if-purple text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-if-purple/20 text-sm"
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
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/15">
                            <Ban size={12} /> Suspenso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/15">
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
                              {/* Gerenciar Medalhas */}
                              <button
                                onClick={() => handleOpenBadgeManager(u._id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-if-text hover:text-white transition-colors flex items-center gap-1"
                                title="Gerenciar medalhas do usuário"
                              >
                                <Award size={13} /> Medalhas
                              </button>

                              {/* Promover a Admin */}
                              <button
                                onClick={() => handleRoleChange(u._id, 'admin', !u.configuracoes.admin)}
                                disabled={u._id === user?.id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${u.configuracoes.admin ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-if-purple/10 text-if-purple border-if-purple/20 hover:bg-if-purple/20'}`}
                                title={u.configuracoes.admin ? "Remover privilégios de Admin" : "Promover a Admin"}
                              >
                                {u.configuracoes.admin ? '- Admin' : '+ Admin'}
                              </button>
                              
                              {/* Promover a Moderador */}
                              {!u.configuracoes.admin && (
                                <button
                                  onClick={() => handleRoleChange(u._id, 'mod', !u.configuracoes.mod_voluntario)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${u.configuracoes.mod_voluntario ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20'}`}
                                >
                                  {u.configuracoes.mod_voluntario ? '- Mod' : '+ Mod'}
                                </button>
                              )}

                              {/* Suspender/Desbloquear */}
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
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-30"
                                >
                                  Suspender
                                </button>
                              )}

                              {/* Excluir Conta */}
                              <button
                                onClick={() => setDeleteUserId(u._id)}
                                disabled={u.configuracoes.admin || u._id === user?.id}
                                className="h-8 w-8 rounded-lg text-red-500 bg-red-500/5 hover:bg-red-500/15 flex items-center justify-center transition-colors border border-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Excluir conta definitivamente"
                              >
                                <Trash2 size={14} />
                              </button>
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

      {/* Modal: Gerenciar Medalhas do Usuário */}
      {badgeUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-if-card border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col max-h-[90vh]">
            <header className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-white">Gerenciar Medalhas</h3>
                <p className="text-xs text-if-text/40 font-bold uppercase tracking-wide">
                  Usuário: {users.find(u => u._id === badgeUserId)?.perfil.nome}
                </p>
              </div>
              <button 
                onClick={() => setBadgeUserId(null)}
                className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-if-text/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            {/* Atribuir Nova Medalha */}
            <section className="mb-6 bg-white/5 border border-white/5 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-if-text/50 uppercase tracking-wider mb-3">Atribuir Nova Recompensa</h4>
              {availableBadges.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1 select-none">
                  {availableBadges.map((badge) => (
                    <button
                      key={badge._id}
                      onClick={() => handleAssignBadge(badge._id)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-if-purple/10 border border-if-purple/15 text-if-purple hover:bg-if-purple hover:text-white text-xs font-bold transition-all active:scale-95"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={badge.icone_url} alt="" className="h-4 w-4 object-contain" />
                      {badge.nome}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-if-text/40 font-semibold italic">Este usuário já conquistou todas as medalhas ativas no sistema.</p>
              )}
            </section>

            {/* Medalhas Conquistadas */}
            <section className="flex-1 overflow-y-auto min-h-[150px] pr-1">
              <h4 className="text-xs font-bold text-if-text/50 uppercase tracking-wider mb-3">Medalhas Atuais ({userBadges.length})</h4>
              
              {loadingUserBadges ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-if-purple" size={24} />
                </div>
              ) : userBadges.length > 0 ? (
                <div className="space-y-3">
                  {userBadges.map((b) => (
                    <div 
                      key={b._id} 
                      className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-2xl group/item hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={b.icone_url} alt="" className="h-6 w-6 object-contain" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-none mb-1">{b.nome}</p>
                          <p className="text-[10px] text-if-text/40 font-semibold uppercase tracking-wider">Conquistada em: {b.awarded_at ? new Date(b.awarded_at).toLocaleDateString() : '---'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveBadge(b._id)}
                        className="h-8 w-8 rounded-lg bg-red-500/5 hover:bg-red-500/15 text-red-500 border border-red-500/10 flex items-center justify-center transition-colors shadow-inner"
                        title="Remover conquista do usuário"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-white/5 border-dashed rounded-2xl">
                  <p className="text-xs text-if-text/40 font-semibold italic">Este usuário ainda não possui nenhuma medalha conquistada.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Confirm: Unsuspend */}
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

      {/* Confirm: Delete User Account */}
      <ConfirmModal 
        isOpen={!!deleteUserId}
        title="Excluir Conta do Usuário"
        message="ATENÇÃO: Deseja realmente excluir permanentemente a conta deste usuário? Todas as suas publicações, comentários, curtidas, seguidores, conquistas e dados associados serão removidos para sempre. Esta ação não poderá ser desfeita."
        confirmText="Excluir Definitivamente"
        isDestructive={true}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteUserId(null)}
      />
    </main>
  );
}
