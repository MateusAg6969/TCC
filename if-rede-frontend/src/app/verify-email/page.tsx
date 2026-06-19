'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [mensagem, setMensagem] = useState('Verificando seu e-mail...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMensagem('Nenhum token de verificação foi encontrado na URL.');
      return;
    }

    let isMounted = true;

    async function verificar() {
      try {
        const res = await api.get(`/auth/verify/${token}`);
        if (isMounted) {
          setStatus('success');
          setMensagem(res.data?.message || 'E-mail confirmado com sucesso!');
        }
      } catch (error: any) {
        if (isMounted) {
          setStatus('error');
          setMensagem(
            error.response?.data?.error?.message ||
              'Não foi possível confirmar o e-mail. O link pode ser inválido ou já ter sido usado.'
          );
        }
      }
    }

    verificar();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <main className="grid min-h-screen place-items-center bg-if-bg p-4">
      <section className="w-full max-w-md rounded-main bg-if-card p-8 text-center text-if-text shadow-card">
        {/* Ícones de feedback */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          {status === 'loading' && (
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-if-olive border-t-transparent" />
          )}
          {status === 'success' && (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-green-500/20 text-green-500">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-rose-500/20 text-rose-500">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        <h1 className="mb-4 text-2xl font-bold">
          {status === 'loading' && 'Aguarde...'}
          {status === 'success' && 'Tudo pronto!'}
          {status === 'error' && 'Oops! Algo deu errado.'}
        </h1>

        <p className="mb-8 text-if-text/80">{mensagem}</p>

        {status !== 'loading' && (
          <Link
            href="/login"
            className="inline-block w-full rounded-full bg-if-olive px-6 py-3 font-semibold text-if-bg transition hover:brightness-110"
          >
            Ir para o Login
          </Link>
        )}
      </section>
    </main>
  );
}
