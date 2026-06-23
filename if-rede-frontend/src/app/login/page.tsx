'use client';

// ============================================================================
// PÁGINA: LOGIN
// ============================================================================
// O que faz: Permite que um usuário cadastrado acesse sua conta na IF REDE.
// Fluxo de dados: Formulário → AuthContext.login() → POST /auth/login → 
//   → Cookies (access + refresh token) → Axios headers → Redirect /home
// Por que JWT + Cookies: Permite proteção de rotas SSR no Next.js Middleware.
// ============================================================================

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  // Obtém a função de login do contexto global de autenticação
  const { login } = useAuth();

  // Estado dos campos do formulário
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Estado de feedback ao usuário
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  // ============================================================================
  // VALIDAÇÃO BÁSICA NO CLIENTE
  // Por que: Evita chamadas desnecessárias ao backend para erros obvios.
  // Fluxo: Valida antes de chamar a API. Erros do backend tratados no catch.
  // ============================================================================
  function validar(): string | null {
    if (!email.trim()) return 'Informe seu email.';
    if (!senha) return 'Informe sua senha.';
    return null;
  }

  // ============================================================================
  // SUBMISSÃO DO FORMULÁRIO
  // O que faz: Captura o evento, previne reload, valida localmente e chama a API.
  // ============================================================================
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Impede o comportamento padrão do HTML (recarregar a página)
    setErro(''); // Limpa erros anteriores

    // Validação local antes de chamar o backend
    const erroLocal = validar();
    if (erroLocal) {
      setErro(erroLocal);
      return;
    }

    setLoading(true);

    try {
      // Delega a lógica de autenticação ao AuthContext:
      // - Faz o POST /auth/login
      // - Salva tokens nos cookies
      // - Configura o Axios para usar o token nas próximas requisições
      // - Redireciona para /home automaticamente
      await login(email, senha);
    } catch (err: any) {
      // ============================================================
      // TRATAMENTO DE ERROS DA API
      // CORREÇÃO: Lê a mensagem real da API antes de usar mensagem genérica.
      // Entrada: Objeto de erro do Axios com err.response.data.error.message
      // Saída: Mensagem legível e acionável para o usuário
      // ============================================================
      const status = err?.response?.status;
      const msgApi = err?.response?.data?.error?.message;

      if (status === 401) {
        // 401 = Credenciais inválidas (email ou senha errados)
        setErro('Email ou senha incorretos. Verifique suas credenciais acadêmicas.');
      } else if (status === 403) {
        // 403 = Conta inativa ou suspensa (verificado no backend)
        setErro('Sua conta está inativa ou suspensa. Entre em contato com a coordenação.');
      } else if (status === 429) {
        // 429 = Rate limit: muitas requisições em pouco tempo
        setErro('Muitas tentativas. Aguarde alguns instantes e tente novamente.');
      } else if (msgApi) {
        // Exibe a mensagem específica retornada pelo backend
        setErro(msgApi);
      } else if (!err?.response) {
        // Sem resposta = servidor offline ou problema de rede/CORS
        setErro('Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3000.');
      } else {
        setErro('Ocorreu um erro inesperado. Tente novamente em instantes.');
      }
    } finally {
      // Sempre desativa o loading, independente de sucesso ou erro
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-if-bg p-4">
      <section className="w-full max-w-md rounded-main bg-if-card p-7 text-if-text shadow-card">

        {/* Cabeçalho com identidade visual IF REDE */}
        <div className="mb-7 text-center">
          <p className="text-xs tracking-[0.28em] text-if-text/70 uppercase">
            Instituto Federal Catarinense
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            IF <span className="text-if-olive">REDE</span>
          </h1>
          <p className="mt-2 text-sm text-if-text/70">
            Conecte sua produção acadêmica e artística.
          </p>
        </div>

        {/* Formulário de login */}
        <form className="space-y-4" onSubmit={onSubmit}>

          {/* Campo de email */}
          <label className="block text-sm font-medium">
            Email
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none focus:border-if-olive/60 transition placeholder:text-if-text/45"
              placeholder="você@ifc.edu.br"
              required
              autoComplete="email"
              autoFocus
            />
          </label>

          {/* Campo de senha */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="login-senha">Senha</label>
              <Link href="/forgot-password" className="text-xs font-medium text-if-olive hover:underline transition-colors">
                Esqueci minha senha
              </Link>
            </div>
            <input
              id="login-senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none focus:border-if-olive/60 transition placeholder:text-if-text/45"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Exibição de erros — mensagem real da API ou validação local */}
          {erro && (
            <p
              role="alert"
              className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300"
            >
              {erro}
            </p>
          )}

          {/* Botão de submissão */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-if-olive px-5 py-3 font-semibold text-if-bg transition hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Link para cadastro */}
        <p className="mt-6 text-center text-sm text-if-text/80">
          Ainda não tem conta?{' '}
          <Link
            href="/register"
            className="font-semibold text-if-olive underline-offset-2 hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </section>
    </main>
  );
}
