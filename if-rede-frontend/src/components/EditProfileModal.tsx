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
    avatar_position?: string;
    banner_position?: string;
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

  // Parser para as posições salvas
  const parseAvatarPosition = (pos?: string) => {
    if (!pos) return { x: 50, y: 50 };
    const parts = pos.split(' ');
    const x = Number(parts[0]?.replace('%', '')) ?? 50;
    const y = Number(parts[1]?.replace('%', '')) ?? 50;
    return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y };
  };

  const parseBannerPosition = (pos?: string) => {
    if (!pos) return 50;
    const y = Number(pos.replace('%', '')) ?? 50;
    return isNaN(y) ? 50 : y;
  };

  const initialAvatar = parseAvatarPosition(defaultData.avatar_position);
  const initialBanner = parseBannerPosition(defaultData.banner_position);

  const [avatarPositionX, setAvatarPositionX] = useState(initialAvatar.x);
  const [avatarPositionY, setAvatarPositionY] = useState(initialAvatar.y);
  const [bannerPositionY, setBannerPositionY] = useState(initialBanner);

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
        customizacao: {
          avatar_position: `${avatarPositionX}% ${avatarPositionY}%`,
          banner_position: `${bannerPositionY}%`
        }, 
      };
      const res = await api.patch('/usuarios/me', payload);
      toast.success('Perfil updated com sucesso!');
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
                  className="group relative w-full h-32 rounded-2xl border-2 border-dashed border-white/10 bg-black/20 overflow-hidden cursor-pointer transition-all hover:border-if-olive/50 hover:bg-black/40 flex items-center justify-center bg-cover"
                  style={{ 
                    backgroundImage: bannerPreview ? `url(${bannerPreview.startsWith('blob:') ? bannerPreview : resolveAssetUrl(bannerPreview)})` : 'none',
                    backgroundPosition: `center ${bannerPositionY}%`
                  }}
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

                {bannerPreview && (
                  <div className="bg-black/20 p-3 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between mb-1 select-none">
                      <span className="text-xs font-bold text-if-text/60">Enquadramento Vertical da Capa</span>
                      <span className="text-xs font-mono text-if-olive font-bold">{bannerPositionY}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={bannerPositionY}
                      onChange={(e) => setBannerPositionY(Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-if-olive focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* AREA DO AVATAR E SEUS AJUSTES */}
              <div className="flex flex-col sm:flex-row gap-4 items-start bg-black/5 p-4 rounded-2xl border border-white/5">
                <div className="flex flex-col gap-2 shrink-0">
                  <span className="text-sm font-bold text-if-text/70">Foto de Perfil</span>
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleAvatarDrop}
                    onClick={() => avatarInputRef.current?.click()}
                    className="group relative w-24 h-24 rounded-3xl border-4 border-if-card bg-black/40 border-dashed overflow-hidden cursor-pointer transition-all hover:border-if-olive/50 bg-cover shadow-xl"
                    style={{ 
                      backgroundImage: avatarPreview ? `url(${avatarPreview.startsWith('blob:') ? avatarPreview : resolveAssetUrl(avatarPreview)})` : 'none',
                      backgroundPosition: `${avatarPositionX}% ${avatarPositionY}%`
                    }}
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

                {avatarPreview && (
                  <div className="flex-1 w-full space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="text-xs font-bold text-if-text/70 block uppercase tracking-wider select-none">Enquadramento da Foto</span>
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1 select-none">
                          <span className="text-[10px] font-bold text-if-text/50">Ajuste Horizontal (Esq. / Dir.)</span>
                          <span className="text-[10px] font-mono text-if-olive font-bold">{avatarPositionX}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={avatarPositionX}
                          onChange={(e) => setAvatarPositionX(Number(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-if-olive focus:outline-none"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1 select-none">
                          <span className="text-[10px] font-bold text-if-text/50">Ajuste Vertical (Cima / Baixo)</span>
                          <span className="text-[10px] font-mono text-if-olive font-bold">{avatarPositionY}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={avatarPositionY}
                          onChange={(e) => setAvatarPositionY(Number(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-if-olive focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
