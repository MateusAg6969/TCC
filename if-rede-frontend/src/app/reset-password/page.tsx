'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [erro, setErro] = useState('');

  // Verifica na montagem se o token existe
  useEffect(() => {
    if (!token) {
      setErro('Token de recuperação ausente. Por favor, solicite a recuperação de senha novamente.');
    }
  }, [token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');

    if (!token) {
      setErro('Token inválido.');
      return;
    }

    if (senha.length < 8) {
      setErro('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, nova_senha: senha });
      setSuccess(true);
    } catch (err: any) {
      setErro(err?.response?.data?.error?.message || 'Ocorreu um erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  }

  if (!token && !erro) {
    return null; // Oculta a UI inicial enquanto o useEffect avalia o token
  }

  return (
    <main className="grid min-h-screen place-items-center bg-if-bg p-4 text-if-text">
      <section className="w-full max-w-md rounded-main bg-if-card p-7 shadow-card border border-white/5">
        
        {success ? (
          <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-500">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-black mb-2 text-white">Senha Redefinida!</h2>
            <p className="text-if-text/70 mb-8">
              Sua senha foi alterada com sucesso. Você já pode acessar sua conta com a nova credencial.
            </p>
            <Link
              href="/login"
              className="inline-block w-full rounded-full bg-if-olive px-6 py-3 font-bold text-if-bg transition hover:brightness-110 active:scale-95"
            >
              Fazer Login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-black tracking-tight mb-2 text-white">
                Nova Senha
              </h1>
              <p className="text-sm text-if-text/70">
                Digite sua nova senha abaixo para redefinir o acesso à sua conta.
              </p>
            </div>

            {!token ? (
              <div className="text-center py-6">
                <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
                <p className="text-rose-400 font-medium mb-6">{erro}</p>
                <Link
                  href="/forgot-password"
                  className="inline-block w-full rounded-full bg-white/5 px-6 py-3 font-bold text-white transition hover:bg-white/10 active:scale-95 border border-white/10"
                >
                  Solicitar Novo Link
                </Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={onSubmit}>
                <label className="block text-sm font-medium">
                  Nova Senha
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-if-text/40">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-4 py-3 outline-none focus:border-if-olive/60 focus:bg-white/5 transition placeholder:text-if-text/30"
                      placeholder="Mínimo 8 caracteres"
                      required
                      autoFocus
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium">
                  Confirmar Nova Senha
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-if-text/40">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-4 py-3 outline-none focus:border-if-olive/60 focus:bg-white/5 transition placeholder:text-if-text/30"
                      placeholder="Repita a senha"
                      required
                    />
                  </div>
                </label>

                {erro && (
                  <p className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
                    {erro}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-if-olive px-5 py-3 font-semibold text-if-bg transition hover:brightness-110 active:scale-95 disabled:opacity-60 mt-4"
                >
                  {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
