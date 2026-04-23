'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [matricula, setMatricula] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const usernameSugestao = useMemo(
    () => username.replace('@', '').trim().toLowerCase(),
    [username]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');

    if (step === 1) {
      if (!email || !senha) {
        setErro('Informe email e senha para continuar.');
        return;
      }
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      await register({
        nome: `${nome} @${usernameSugestao}`,
        email,
        matricula,
        senha,
      });
    } catch {
      setErro('Não foi possível concluir seu cadastro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-if-bg p-4">
      <section className="w-full max-w-xl rounded-main bg-if-card p-7 text-if-text shadow-card">
        <h1 className="text-3xl font-bold">Cadastro IF REDE</h1>
        <p className="mt-1 text-sm text-if-text/70">Etapa {step} de 2</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {step === 1 && (
            <>
              <label className="block text-sm">
                Email institucional
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none"
                  required
                />
              </label>

              <label className="block text-sm">
                Senha
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none"
                  required
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <label className="block text-sm">
                Nome completo
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none"
                  required
                />
              </label>

              <label className="block text-sm">
                Nome de usuário (@handle)
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none"
                  placeholder="seu.handle"
                  required
                />
              </label>

              <label className="block text-sm">
                Matrícula
                <input
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none"
                  required
                />
              </label>
            </>
          )}

          {erro && <p className="text-sm text-rose-300">{erro}</p>}

          <div className="flex gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full rounded-full border border-white/20 px-4 py-3 text-sm"
              >
                Voltar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-if-olive px-5 py-3 font-semibold text-if-bg disabled:opacity-60"
            >
              {loading ? 'Finalizando...' : step === 1 ? 'Próximo' : 'Criar conta'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-sm text-if-text/75">
          Já possui conta?{' '}
          <Link href="/login" className="font-semibold text-if-olive hover:underline">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
