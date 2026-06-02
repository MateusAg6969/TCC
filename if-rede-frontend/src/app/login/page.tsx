'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  // Fluxo de Submissão: Captura os dados do formulário e aciona o contexto de autenticação.
  // O que faz: Previne o comportamento padrão do HTML, limpa erros anteriores e gerencia o estado de loading.
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // Por que: Delegamos a lógica de autenticação (cookies/axios) para o AuthContext.
      await login(email, senha);
    } catch (err: any) {
      // Entrada: Erro capturado da API ou do AuthContext.
      // Saida: Mensagem didática para o usuário final.
      const status = err.response?.status;
      if (status === 401) {
        setErro('Email ou senha incorretos. Verifique suas credenciais acadêmicas.');
      } else if (status === 403) {
        setErro('Sua conta está inativa ou suspensa. Entre em contato com a coordenação.');
      } else {
        setErro('Não foi possível conectar ao servidor. Tente novamente em instantes.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-if-bg p-4">
      <section className="w-full max-w-md rounded-main bg-if-card p-7 text-if-text shadow-card">
        <div className="mb-7 text-center">
          <p className="text-xs tracking-[0.28em] text-if-text/70">INSTITUTO FEDERAL CATARINENSE</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            IF <span className="text-if-olive">REDE</span>
          </h1>
          <p className="mt-2 text-sm text-if-text/70">Conecte sua produção acadêmica e artística.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none placeholder:text-if-text/45"
              placeholder="voce@ifc.edu.br"
              required
            />
          </label>

          <label className="block text-sm">
            Senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none placeholder:text-if-text/45"
              placeholder="********"
              required
            />
          </label>

          {erro && <p className="text-sm text-rose-300">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-if-olive px-5 py-3 font-semibold text-if-bg transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-if-text/80">
          Ainda não tem conta?{' '}
          <Link href="/register" className="font-semibold text-if-olive underline-offset-2 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </section>
    </main>
  );
}
