'use client';

// ============================================================================
// PÁGINA: CADASTRO (Register)
// ============================================================================
// O que faz: Permite que um novo usuário crie uma conta na IF REDE.
// Fluxo de dados: Formulário em 2 etapas → AuthContext.register() → POST /auth/register → Redirect /home
// Por que 2 etapas: Reduz a carga cognitiva — credenciais primeiro, perfil depois.
// ============================================================================

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  // Obtém a função de registro do contexto global de autenticação
  const { register } = useAuth();

  // Controle de etapa do formulário (1 = credenciais, 2 = perfil)
  const [step, setStep] = useState(1);

  // Etapa 1: Credenciais de acesso
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Etapa 2: Dados do perfil
  // CORREÇÃO: nome e handle são campos SEPARADOS — não mais concatenados.
  // Por que: O backend espera apenas o nome no campo 'nome'. O handle (@username)
  // é apenas uma preferência visual do usuário e NÃO é um campo do schema atual.
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  // status_vinculo define as permissões e limites do usuário no sistema
  const [statusVinculo, setStatusVinculo] = useState<'estudante' | 'egresso' | 'servidor'>('estudante');

  // Estado de feedback para o usuário
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  // ============================================================================
  // VALIDAÇÃO: ETAPA 1 — Credenciais
  // ============================================================================
  function validarEtapa1(): string | null {
    if (!email || !senha) return 'Informe email e senha para continuar.';
    // Verifica se a senha tem ao menos 8 caracteres (regra do backend: minlength: 8)
    if (senha.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
    // Confirma que as senhas coincidem antes de avançar
    if (senha !== confirmarSenha) return 'As senhas não coincidem.';
    return null; // null = sem erros
  }

  // ============================================================================
  // VALIDAÇÃO: ETAPA 2 — Perfil
  // ============================================================================
  function validarEtapa2(): string | null {
    if (!nome || nome.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres.';
    // Regex alinhada com o schema do backend: 4-20 caracteres alfanuméricos
    if (!matricula || !/^[a-zA-Z0-9\-]{4,20}$/.test(matricula)) {
      return 'Matrícula inválida. Use entre 4 e 20 caracteres alfanuméricos.';
    }
    return null;
  }

  // ============================================================================
  // SUBMISSÃO DO FORMULÁRIO
  // O que faz: Gerencia a progressão de etapas e a chamada final ao AuthContext.
  // ============================================================================
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');

    // --- ETAPA 1: Apenas valida e avança ---
    if (step === 1) {
      const erroEtapa = validarEtapa1();
      if (erroEtapa) {
        setErro(erroEtapa);
        return;
      }
      setStep(2);
      return;
    }

    // --- ETAPA 2: Valida e envia ao backend ---
    const erroEtapa = validarEtapa2();
    if (erroEtapa) {
      setErro(erroEtapa);
      return;
    }

    setLoading(true);
    try {
      // CORREÇÃO: envia 'nome' puro, sem handle concatenado.
      // Fluxo: AuthContext.register() → POST /auth/register → { nome, email, matricula, senha, status_vinculo }
      await register({
        nome: nome.trim(),
        email,
        matricula,
        senha,
        status_vinculo: statusVinculo,
      });
      // Após sucesso, o próprio AuthContext redireciona para /home
    } catch (err: any) {
      // CORREÇÃO: lê a mensagem de erro real retornada pela API, em vez de mostrar mensagem genérica.
      // Entrada: objeto de erro do Axios com err.response.data.error.message
      // Saída: mensagem compreensível para o usuário
      const msgApi = err?.response?.data?.error?.message;
      const status = err?.response?.status;

      if (status === 409) {
        // Código 409 = Conflict = Registro duplicado (email ou matrícula já existem)
        setErro('Email ou matrícula já cadastrados. Verifique seus dados.');
      } else if (status === 400 && msgApi) {
        // Código 400 = Bad Request = Erro de validação do schema Mongoose
        setErro(`Dados inválidos: ${msgApi}`);
      } else if (msgApi) {
        setErro(msgApi);
      } else {
        setErro('Não foi possível concluir seu cadastro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-if-bg p-4">
      <section className="w-full max-w-xl rounded-main bg-if-card p-7 text-if-text shadow-card">

        {/* Cabeçalho com identidade visual IF REDE */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            Criar conta <span className="text-if-olive">IF REDE</span>
          </h1>
          {/* Indicador de progresso visual */}
          <p className="mt-1 text-sm text-if-text/70">Etapa {step} de 2</p>
          {/* Barra de progresso */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-if-olive transition-all duration-500"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>

          {/* ============================================================ */}
          {/* ETAPA 1: Credenciais de acesso */}
          {/* ============================================================ */}
          {step === 1 && (
            <>
              <label className="block text-sm font-medium">
                Email institucional
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none focus:border-if-olive/60 transition placeholder:text-if-text/45"
                  placeholder="você@ifc.edu.br"
                  required
                  autoComplete="email"
                />
              </label>

              <label className="block text-sm font-medium">
                Senha
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none focus:border-if-olive/60 transition placeholder:text-if-text/45"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </label>

              <label className="block text-sm font-medium">
                Confirmar senha
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none focus:border-if-olive/60 transition placeholder:text-if-text/45"
                  placeholder="Repita sua senha"
                  required
                  autoComplete="new-password"
                />
              </label>
            </>
          )}

          {/* ============================================================ */}
          {/* ETAPA 2: Dados de perfil e vínculo institucional */}
          {/* ============================================================ */}
          {step === 2 && (
            <>
              <label className="block text-sm font-medium">
                Nome completo
                {/* CORREÇÃO: campo separado — apenas o nome real, sem handle concatenado */}
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none focus:border-if-olive/60 transition"
                  placeholder="Seu nome completo"
                  minLength={3}
                  required
                  autoComplete="name"
                />
              </label>

              <label className="block text-sm font-medium">
                Matrícula
                {/* Dica visível: informa o formato aceito antes que o backend rejeite */}
                <span className="ml-2 text-xs text-if-text/50">(4–20 caracteres alfanuméricos)</span>
                <input
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none focus:border-if-olive/60 transition"
                  placeholder="ex: 20260001 ou IFC-001"
                  required
                  autoComplete="off"
                />
              </label>

              {/* Campo de vínculo institucional — define permissões no sistema */}
              <label className="block text-sm font-medium">
                Vínculo institucional
                <select
                  value={statusVinculo}
                  onChange={(e) => setStatusVinculo(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-if-olive/15 px-4 py-3 outline-none focus:border-if-olive/60 transition text-if-text"
                >
                  <option value="estudante">Estudante</option>
                  <option value="egresso">Egresso (ex-aluno)</option>
                  <option value="servidor">Servidor / Professor</option>
                </select>
              </label>
            </>
          )}

          {/* Exibição de erros — mostra a mensagem real da API, não uma genérica */}
          {erro && (
            <p className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
              {erro}
            </p>
          )}

          {/* Botões de navegação */}
          <div className="flex gap-3 pt-1">
            {step === 2 && (
              <button
                type="button"
                onClick={() => { setStep(1); setErro(''); }}
                className="w-full rounded-full border border-white/20 px-4 py-3 text-sm hover:bg-white/5 transition"
              >
                ← Voltar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-if-olive px-5 py-3 font-semibold text-if-bg hover:brightness-110 transition disabled:opacity-60"
            >
              {loading ? 'Criando conta...' : step === 1 ? 'Próximo →' : 'Criar conta'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-sm text-if-text/75 text-center">
          Já possui conta?{' '}
          <Link href="/login" className="font-semibold text-if-olive hover:underline underline-offset-2">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
