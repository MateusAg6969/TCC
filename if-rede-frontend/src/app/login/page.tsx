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
import { Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  // Obtém a função de login do contexto global de autenticação
  const { login } = useAuth();

  // Estado dos campos do formulário
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Estado para armazenar se o usuário deseja permanecer logado (Lembre de mim)
  const [rememberMe, setRememberMe] = useState(false);

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
      // - Faz o POST /auth/login repassando email, senha e a preferência rememberMe
      // - Salva tokens nos cookies (Sessão ou 30 dias)
      // - Configura o Axios para usar o token nas próximas requisições
      // - Redireciona para /home automaticamente
      await login(email, senha, rememberMe);
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
        // 403 = Pode ser conta inativa, suspensa, ou e-mail não confirmado.
        if (msgApi && msgApi.includes('Confirme seu e-mail')) {
          setErro(msgApi);
        } else {
          setErro('Sua conta está inativa ou suspensa. Entre em contato com a coordenação.');
        }
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
            <label className="text-sm font-medium" htmlFor="login-senha">Senha</label>
            <div className="relative">
              <input
                id="login-senha"
                type={showPassword ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 pl-4 pr-12 py-3 outline-none focus:border-if-olive/60 transition placeholder:text-if-text/45"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 mt-1 text-if-text/50 hover:text-if-olive transition-colors"
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Opções extras do formulário: Lembre de mim e Esqueci minha senha */}
          <div className="flex items-center justify-between pt-1">
            <label
              htmlFor="login-remember"
              className="group flex cursor-pointer items-center gap-2.5 select-none"
            >
              <div className="relative flex items-center justify-center">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-5 w-5 rounded-lg border border-white/20 bg-if-olive/15 transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-if-olive peer-checked:border-if-olive peer-checked:bg-if-olive group-hover:border-if-olive/60 flex items-center justify-center shadow-xs">
                  <Check className={`h-3.5 w-3.5 stroke-[3] text-if-bg transition-all duration-200 ${rememberMe ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
                </div>
              </div>
              <span className="text-sm text-if-text/80 transition-colors group-hover:text-if-text">
                Lembre de mim
              </span>
            </label>

            <Link
              href="/forgot-password"
              className="text-xs font-medium text-if-olive hover:underline transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>

          {/* Exibição de erros — mensagem real da API ou validação local */}
          {erro && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
              <p role="alert">{erro}</p>
              {erro.includes('Confirme seu e-mail') && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const { api } = await import('@/lib/api');
                      await api.post('/auth/resend-verification', { email });
                      setErro('E-mail reenviado com sucesso! Verifique sua caixa de entrada.');
                    } catch (err: any) {
                      setErro(err?.response?.data?.error?.message || 'Erro ao reenviar e-mail.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="mt-2 text-xs font-semibold text-if-olive hover:underline"
                >
                  Reenviar e-mail de confirmação
                </button>
              )}
            </div>
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
