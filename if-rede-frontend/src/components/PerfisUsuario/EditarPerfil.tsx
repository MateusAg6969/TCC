'use client';

/**
 * EditarPerfil Component
 * 
 * Formulário para editar dados do perfil do usuário autenticado.
 * 
 * Features:
 * - Editar nome
 * - Editar bio
 * - Upload de foto
 * - Validações básicas
 * - Feedback visual de sucesso/erro
 * 
 * Identidade Visual: Roxo/Oliva com form estilizado
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Save, X } from 'lucide-react';
import { useUsuario } from '@/hooks/useUsuario';
import ModalCarregamento from '../Common/ModalCarregamento';

interface EditarPerfilProps {
  usuarioInicial?: {
    nome: string;
    bio?: string;
    avatar?: string;
  };
  onSucesso?: () => void;
}

export default function EditarPerfil({
  usuarioInicial = {
    nome: '',
    bio: '',
  },
  onSucesso,
}: EditarPerfilProps) {
  const router = useRouter();
  const { loading, error, atualizarPerfil, atualizarFoto } = useUsuario();

  const [nome, setNome] = useState(usuarioInicial.nome);
  const [bio, setBio] = useState(usuarioInicial.bio || '');
  const [privacidade, setPrivacidade] = useState<'publico' | 'privado'>('publico');
  const [fotoSelecionada, setFotoSelecionada] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState(usuarioInicial.avatar);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [sucesso, setSucesso] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validar = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    }

    if (nome.trim().length < 3) {
      novosErros.nome = 'Nome deve ter no mínimo 3 caracteres';
    }

    if (bio.length > 500) {
      novosErros.bio = 'Bio não pode ter mais de 500 caracteres';
    }

    if (fotoSelecionada && fotoSelecionada.size > 5 * 1024 * 1024) {
      novosErros.foto = 'Arquivo não pode ser maior que 5MB';
    }

    if (fotoSelecionada && !['image/jpeg', 'image/png', 'image/webp'].includes(fotoSelecionada.type)) {
      novosErros.foto = 'Formato de imagem inválido. Use JPEG, PNG ou WebP';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSelecionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFotoSelecionada(file);

    // Criar preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewFoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validar()) return;

    try {
      setSucesso(false);

      // Atualizar perfil
      await atualizarPerfil({
        nome: nome.trim(),
        bio: bio.trim(),
        privacidade,
      });

      // Atualizar foto se selecionada
      if (fotoSelecionada) {
        await atualizarFoto(fotoSelecionada);
      }

      setSucesso(true);
      onSucesso?.();

      // Redirecionar após sucesso
      setTimeout(() => {
        router.push('/home');
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar perfil';
      setErros({ envio: msg });
    }
  };

  const handleCancelar = () => {
    router.back();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleEnviar} className="space-y-6">
        {/* Upload de Foto */}
        <div className="bg-if-card rounded-main border border-if-olive/30 p-6">
          <h3 className="text-lg font-bold text-if-text mb-4">Foto de Perfil</h3>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Preview */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-if-olive/20 overflow-hidden border-2 border-if-olive/40">
                {previewFoto ? (
                  <img
                    src={previewFoto}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-if-olive/50">
                    Sem foto
                  </div>
                )}
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSelecionarFoto}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="
                  w-full px-4 py-2 rounded-main
                  bg-purple-600 hover:bg-purple-700
                  text-if-text font-medium
                  transition-colors duration-150
                  flex items-center justify-center gap-2
                "
              >
                <Upload size={18} />
                Selecionar Imagem
              </button>

              {fotoSelecionada && (
                <p className="text-sm text-if-olive mt-2">
                  {fotoSelecionada.name}
                </p>
              )}

              {erros.foto && (
                <p className="text-sm text-red-400 mt-2">{erros.foto}</p>
              )}
            </div>
          </div>
        </div>

        {/* Dados do Perfil */}
        <div className="bg-if-card rounded-main border border-if-olive/30 p-6 space-y-4">
          <h3 className="text-lg font-bold text-if-text">Informações Pessoais</h3>

          {/* Nome */}
          <div>
            <label className="block text-if-text font-medium mb-2">
              Nome *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              className={`
                w-full px-4 py-2 rounded-main
                bg-if-bg border
                text-if-text placeholder:text-if-olive/50
                focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent
                transition-colors duration-150
                ${erros.nome ? 'border-red-600' : 'border-if-olive/30'}
              `}
            />
            {erros.nome && (
              <p className="text-sm text-red-400 mt-1">{erros.nome}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-if-text font-medium mb-2">
              Bio ({bio.length}/500)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte um pouco sobre você..."
              maxLength={500}
              rows={4}
              className={`
                w-full px-4 py-2 rounded-main
                bg-if-bg border
                text-if-text placeholder:text-if-olive/50
                focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent
                transition-colors duration-150
                resize-none
                ${erros.bio ? 'border-red-600' : 'border-if-olive/30'}
              `}
            />
            {erros.bio && (
              <p className="text-sm text-red-400 mt-1">{erros.bio}</p>
            )}
          </div>

          {/* Privacidade */}
          <div>
            <label className="block text-if-text font-medium mb-2">
              Privacidade do Perfil
            </label>
            <select
              value={privacidade}
              onChange={(e) => setPrivacidade(e.target.value as 'publico' | 'privado')}
              className="
                w-full px-4 py-2 rounded-main
                bg-if-bg border border-if-olive/30
                text-if-text
                focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent
                transition-colors duration-150
              "
            >
              <option value="publico">Público (qualquer um pode ver)</option>
              <option value="privado">Privado (apenas amigos)</option>
            </select>
          </div>
        </div>

        {/* Erro Geral */}
        {(error || erros.envio) && (
          <div className="bg-red-600/20 border border-red-600/40 rounded-main p-4 text-red-400 text-sm">
            {error || erros.envio}
          </div>
        )}

        {/* Sucesso */}
        {sucesso && (
          <div className="bg-green-600/20 border border-green-600/40 rounded-main p-4 text-green-400 text-sm">
            Perfil atualizado com sucesso!
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancelar}
            className="
              flex-1 px-4 py-3 rounded-main
              bg-if-olive/20 hover:bg-if-olive/30
              text-if-text font-medium
              transition-colors duration-150
              flex items-center justify-center gap-2
            "
          >
            <X size={18} />
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="
              flex-1 px-4 py-3 rounded-main
              bg-purple-600 hover:bg-purple-700
              text-if-text font-medium
              transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            <Save size={18} />
            Salvar Alterações
          </button>
        </div>
      </form>

      {/* Loading Modal */}
      {loading && <ModalCarregamento mensagem="Salvando alterações..." />}
    </div>
  );
}
