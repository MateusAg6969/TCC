'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  defaultName: string;
  defaultUsername: string;
};

export default function EditProfileModal({ open, onClose, defaultName, defaultUsername }: Props) {
  const [nome, setNome] = useState(defaultName);
  const [username, setUsername] = useState(defaultUsername);
  const [perfilPublico, setPerfilPublico] = useState(true);
  const [mostrarVisitas, setMostrarVisitas] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-main bg-if-card p-6 text-if-text shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Editar perfil</h3>
          <button onClick={onClose} className="rounded-full bg-black/20 p-2 hover:bg-black/30">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm">
            Nome
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-if-olive/20 px-4 py-2 outline-none"
            />
          </label>

          <label className="block text-sm">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-if-olive/20 px-4 py-2 outline-none"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3 text-sm">
            Perfil Público
            <input type="checkbox" checked={perfilPublico} onChange={() => setPerfilPublico((v) => !v)} />
          </label>

          <label className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3 text-sm">
            Mostrar Visitas
            <input type="checkbox" checked={mostrarVisitas} onChange={() => setMostrarVisitas((v) => !v)} />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-white/20 px-4 py-2 text-sm">
            Cancelar
          </button>
          <button onClick={onClose} className="rounded-full bg-if-olive px-5 py-2 text-sm font-semibold text-if-bg">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
