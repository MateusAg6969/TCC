'use client';

import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  defaultData: {
    nome: string;
    bio: string;
    privacidade: string;
    avatar_url: string;
    banner_url: string;
  };
};

export default function EditProfileModal({ open, onClose, onSave, defaultData }: Props) {
  const [nome, setNome] = useState(defaultData.nome);
  const [bio, setBio] = useState(defaultData.bio);
  const [privacidade, setPrivacidade] = useState(defaultData.privacidade);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(defaultData.avatar_url || '');
  const [bannerPreview, setBannerPreview] = useState(defaultData.banner_url || '');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  if (!open) return null;

  const handleSalvar = async () => {
    setCarregando(true);
    setErro('');
    try {
      if (avatarFile || bannerFile) {
        const formData = new FormData();
        if (avatarFile) formData.append('avatar', avatarFile);
        if (bannerFile) formData.append('banner', bannerFile);
        
        await api.post('/usuarios/me/midia', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      const payload = {
        perfil: { nome, bio, privacidade },
        customizacao: {}, 
      };
      const res = await api.patch('/usuarios/me', payload);
      toast.success('Perfil atualizado com sucesso!');
      onSave(res.data.data);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Erro ao atualizar perfil.';
      setErro(msg);
      toast.error(msg);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 overflow-y-auto py-8">
      <div className="w-full max-w-lg rounded-main bg-if-card p-6 text-if-text shadow-card my-auto">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Editar perfil</h3>
          <button 
            onClick={onClose} 
            aria-label="Fechar modal"
            className="rounded-full bg-black/20 p-2 hover:bg-black/30"
          >
            <X size={16} />
          </button>
        </div>

        {erro && (
          <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
            {erro}
          </div>
        )}

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <label className="block text-sm font-medium text-if-text/70">
            Nome de exibição
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 outline-none focus:border-if-purple/50 transition-all"
              placeholder="Como você quer ser chamado?"
            />
          </label>

          <label className="block text-sm font-medium text-if-text/70">
            Bio / Descrição
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 outline-none focus:border-if-purple/50 transition-all resize-none"
              placeholder="Conte um pouco sobre você..."
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-if-text/70">Foto de Perfil</span>
            <div className="flex flex-col gap-2">
              <div 
                className="w-20 h-20 rounded-full bg-black/20 border border-white/10 overflow-hidden bg-cover bg-center shrink-0"
                style={{ backgroundImage: avatarPreview ? `url(${avatarPreview.startsWith('http') || avatarPreview.startsWith('blob:') ? avatarPreview : 'http://localhost:3000' + avatarPreview})` : 'none' }}
              />
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }
                }}
                className="text-sm text-if-text/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-if-purple file:text-white hover:file:bg-if-purple/80 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-if-text/70">Banner do Perfil</span>
            <div className="flex flex-col gap-2">
              <div 
                className="w-full h-24 rounded-2xl bg-black/20 border border-white/10 overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: bannerPreview ? `url(${bannerPreview.startsWith('http') || bannerPreview.startsWith('blob:') ? bannerPreview : 'http://localhost:3000' + bannerPreview})` : 'none' }}
              />
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setBannerFile(file);
                    setBannerPreview(URL.createObjectURL(file));
                  }
                }}
                className="text-sm text-if-text/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-if-purple file:text-white hover:file:bg-if-purple/80 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-if-text/70">Privacidade do Perfil</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPrivacidade('publico')}
                className={`flex-1 rounded-xl py-2 text-sm font-bold border transition-all ${
                  privacidade === 'publico' ? 'bg-if-purple border-if-purple text-white' : 'bg-black/20 border-white/10'
                }`}
              >
                Público
              </button>
              <button
                onClick={() => setPrivacidade('privado')}
                className={`flex-1 rounded-xl py-2 text-sm font-bold border transition-all ${
                  privacidade === 'privado' ? 'bg-if-purple border-if-purple text-white' : 'bg-black/20 border-white/10'
                }`}
              >
                Privado
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button 
            disabled={carregando}
            onClick={onClose} 
            className="rounded-full border border-white/10 px-6 py-2 text-sm font-medium hover:bg-white/5 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            disabled={carregando}
            onClick={handleSalvar} 
            className="rounded-full bg-if-olive px-8 py-2 text-sm font-bold text-if-bg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {carregando && <Loader2 size={16} className="animate-spin" />}
            {carregando ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
