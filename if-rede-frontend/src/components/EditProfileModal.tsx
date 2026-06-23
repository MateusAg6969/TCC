'use client';

import { X, Loader2, UploadCloud } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import api, { resolveAssetUrl } from '@/lib/api';
import CustomSelect from '@/components/CustomSelect';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  defaultData: {
    nome: string;
    apelido?: string;
    bio?: string;
    privacidade: string;
    avatar_url: string;
    banner_url: string;
  };
};

export default function EditProfileModal({ open, onClose, onSave, defaultData }: Props) {
  const [nome, setNome] = useState(defaultData.nome);
  const [apelido, setApelido] = useState(defaultData.apelido || '');
  const [bio, setBio] = useState(defaultData.bio || '');
  const [privacidade, setPrivacidade] = useState(defaultData.privacidade || 'publico');
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const [avatarPreview, setAvatarPreview] = useState(defaultData.avatar_url || '');
  const [bannerPreview, setBannerPreview] = useState(defaultData.banner_url || '');
  
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleSalvar = async () => {
    setCarregando(true);
    setErro('');
    try {
      if (avatarFile || bannerFile) {
        const formData = new FormData();
        if (avatarFile) formData.append('avatar', avatarFile);
        if (bannerFile) formData.append('banner', bannerFile);
        
        await api.post('/usuarios/me/midia', formData);
      }

      const payload = {
        perfil: { nome, apelido, bio, privacidade },
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

  const handleAvatarDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center px-4 overflow-y-auto py-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-lg rounded-[2rem] bg-if-card/90 backdrop-blur-xl border border-white/10 p-8 text-if-text shadow-2xl relative z-10"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-black text-white">Editar Perfil</h3>
              <button 
                onClick={onClose} 
                aria-label="Fechar modal"
                className="rounded-full bg-white/5 p-2 hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-white/70" />
              </button>
            </div>

            {erro && (
              <div className="mb-6 rounded-2xl bg-red-500/10 p-4 text-sm font-bold text-red-500 border border-red-500/20 text-center">
                {erro}
              </div>
            )}

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              
              {/* AREA DA CAPA (BANNER) */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-if-text/70">Capa do Perfil</span>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleBannerDrop}
                  onClick={() => bannerInputRef.current?.click()}
                  className="group relative w-full h-32 rounded-2xl border-2 border-dashed border-white/10 bg-black/20 overflow-hidden cursor-pointer transition-all hover:border-if-olive/50 hover:bg-black/40 flex items-center justify-center bg-cover bg-center"
                  style={{ backgroundImage: bannerPreview ? `url(${bannerPreview.startsWith('blob:') ? bannerPreview : resolveAssetUrl(bannerPreview)})` : 'none' }}
                >
                  <input 
                    type="file" 
                    accept="image/*"
                    ref={bannerInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setBannerFile(file);
                        setBannerPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-full bg-if-olive/20 text-if-olive flex items-center justify-center">
                      <UploadCloud size={20} />
                    </div>
                    <span className="text-xs font-bold text-white">Alterar Capa</span>
                  </div>
                </div>
              </div>

              {/* AREA DO AVATAR */}
              <div className="flex flex-col gap-2 -mt-12 relative z-10 pl-4">
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleAvatarDrop}
                  onClick={() => avatarInputRef.current?.click()}
                  className="group relative w-24 h-24 rounded-3xl border-4 border-if-card bg-black/40 border-dashed overflow-hidden cursor-pointer transition-all hover:border-if-olive/50 bg-cover bg-center shadow-xl"
                  style={{ backgroundImage: avatarPreview ? `url(${avatarPreview.startsWith('blob:') ? avatarPreview : resolveAssetUrl(avatarPreview)})` : 'none' }}
                >
                  <input 
                    type="file" 
                    accept="image/*"
                    ref={avatarInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <UploadCloud size={24} className="text-if-olive" />
                  </div>
                </div>
              </div>

              {/* DADOS TEXTUAIS */}
              <div className="space-y-5">
                <label className="block">
                  <span className="text-sm font-bold text-if-text/70 mb-2 block">Apelido (Como você aparece na rede)</span>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full rounded-2xl border border-white/5 bg-black/20 px-5 py-4 text-base outline-none focus:border-if-olive/50 transition-all font-medium text-white"
                    placeholder="Como você quer ser chamado?"
                  />
                </label>

                <div>
                    <label className="mb-2 block text-sm font-bold text-if-text/80">Apelido (Curto)</label>
                    <input
                      value={apelido}
                      onChange={(e) => setApelido(e.target.value)}
                      className="w-full rounded-2xl border-2 border-if-olive/10 bg-white/5 px-4 py-3 text-if-text outline-none focus:border-if-olive transition-colors"
                      placeholder="Como você prefere ser chamado"
                      maxLength={50}
                    />
                  </div>

                <label className="block">
                  <span className="text-sm font-bold text-if-text/70 mb-2 block">Bio / Descrição</span>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-white/5 bg-black/20 px-5 py-4 text-base outline-none focus:border-if-olive/50 transition-all resize-none font-medium text-white"
                    placeholder="Conte um pouco sobre você..."
                  />
                </label>

                <div className="relative z-50">
                  <span className="text-sm font-bold text-if-text/70 mb-2 block">Privacidade do Perfil</span>
                  <CustomSelect 
                    options={[
                      { value: 'publico', label: '🌍 Público (Visível para todos)' },
                      { value: 'privado', label: '🔒 Privado (Apenas seguidores aprovados)' }
                    ]}
                    value={privacidade}
                    onChange={(val) => setPrivacidade(val)}
                  />
                </div>
              </div>

            </div>

            {/* BOTOES DE ACAO */}
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-white/5">
              <button 
                disabled={carregando}
                onClick={onClose} 
                className="rounded-2xl border-2 border-transparent px-6 py-3 text-sm font-bold text-if-text/70 hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                disabled={carregando}
                onClick={handleSalvar} 
                className="rounded-2xl border-2 border-if-olive/20 bg-if-olive/10 px-8 py-3 text-sm font-bold text-if-olive hover:bg-if-olive hover:text-if-bg active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
              >
                {carregando && <Loader2 size={16} className="animate-spin" />}
                {carregando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
