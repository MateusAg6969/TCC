'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [erro, setErro] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setErro('Informe seu email.');
      return;
    }

    setErro('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setErro(err?.response?.data?.error?.message || 'Ocorreu um erro ao processar sua solicitação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-if-bg p-4 text-if-text">
      <section className="w-full max-w-md rounded-main bg-if-card p-7 shadow-card border border-white/5">
        
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-if-text/50 hover:text-if-olive transition-colors">
          <ArrowLeft size={16} /> Voltar ao Login
        </Link>

        {success ? (
          <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-500">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-black mb-2 text-white">E-mail Enviado!</h2>
            <p className="text-if-text/70 mb-6">
              Se houver uma conta cadastrada com <strong className="text-white">{email}</strong>, você receberá um link para redefinir sua senha em instantes.
            </p>
            <p className="text-xs text-if-text/50">Não esqueça de verificar a caixa de spam ou lixo eletrônico.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-black tracking-tight mb-2 text-white">
                Recuperar Senha
              </h1>
              <p className="text-sm text-if-text/70">
                Digite o e-mail associado à sua conta e enviaremos instruções para redefinir sua senha.
              </p>
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              <label className="block text-sm font-medium">
                Email cadastrado
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-if-text/40">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-4 py-3 outline-none focus:border-if-olive/60 focus:bg-white/5 transition placeholder:text-if-text/30"
                    placeholder="você@ifc.edu.br"
                    required
                    autoComplete="email"
                    autoFocus
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
                className="w-full rounded-full bg-if-olive px-5 py-3 font-semibold text-if-bg transition hover:brightness-110 active:scale-95 disabled:opacity-60 mt-2"
              >
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
