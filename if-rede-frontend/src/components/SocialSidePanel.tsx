'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  userName: string;
};

export default function SocialSidePanel({ isOpen, onClose, userId, type, userName }: Props) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchList = async () => {
        setLoading(true);
        try {
          const endpoint = type === 'followers' ? `/usuarios/${userId}/seguidores` : `/usuarios/${userId}/seguindo`;
          const res = await api.get(endpoint);
          setList(res.data.data || []);
        } catch (err) {
          console.error('Erro ao carregar lista social:', err);
          toast.error('Não foi possível carregar a lista. Tente novamente.');
        } finally {
          setLoading(false);
        }
      };
      fetchList();
    }
  }, [isOpen, userId, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Painel Lateral */}
      <aside className="relative w-full max-w-md bg-if-card h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-white/5">
        <header className="p-6 border-b border-white/5 bg-gradient-to-r from-if-purple/10 to-transparent flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-if-purple flex items-center gap-2">
              {type === 'followers' ? <Users size={24} /> : <UserPlus size={24} />}
              {type === 'followers' ? 'Seguidores' : 'Seguindo'}
            </h2>
            <p className="text-xs text-if-text/50 font-medium mt-1 uppercase tracking-widest">
              Rede de {userName}
            </p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Fechar painel"
            className="p-2 rounded-full bg-white/5 hover:bg-if-purple hover:text-white transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-if-purple">
              <Loader2 size={40} className="animate-spin mb-4" />
              <p className="font-bold text-sm animate-pulse">Sincronizando rede acadêmica...</p>
            </div>
          ) : list.length > 0 ? (
            <div className="grid gap-3">
              {list.map((user) => (
                <Link
                  key={user._id}
                  href={`/profile/${user._id}`}
                  onClick={onClose}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-if-purple/40 hover:bg-black/30 transition-all group"
                >
                  <div 
                    className="h-14 w-14 rounded-2xl bg-if-purple/20 flex items-center justify-center font-black text-xl bg-cover bg-center border-2 border-transparent group-hover:border-if-purple/50 transition-all"
                    style={user.customizacao?.avatar_url ? { backgroundImage: `url(${user.customizacao.avatar_url})` } : {}}
                  >
                    {!user.customizacao?.avatar_url && (user.perfil?.nome || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-if-text group-hover:text-if-purple transition-colors truncate">
                      {user.perfil?.nome}
                    </h4>
                    <p className="text-xs text-if-text/40 font-medium">Acadêmico do IFC</p>
                  </div>
                  <ArrowRight size={18} className="text-if-text/20 group-hover:text-if-purple group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 text-if-text/10">
                <Users size={40} />
              </div>
              <h3 className="text-lg font-bold text-if-text/60">Lista vazia</h3>
              <p className="text-sm text-if-text/40 mt-2">
                Ainda não há conexões acadêmicas para exibir nesta categoria.
              </p>
            </div>
          )}
        </div>

        <footer className="p-6 bg-black/20 border-t border-white/5 text-center">
          <p className="text-[10px] text-if-text/30 font-bold uppercase tracking-widest">
            IF REDE • Conectando Conhecimento
          </p>
        </footer>
      </aside>
    </div>
  );
}
