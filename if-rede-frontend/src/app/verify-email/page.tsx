'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando seu e-mail...');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificação ausente na URL.');
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    api.get(`/auth/verify/${token}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'E-mail confirmado com sucesso!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'Token de verificação inválido ou expirado.');
      });
  }, [token]);

  return (
    <main className="grid min-h-screen place-items-center bg-if-bg p-4 text-if-text">
      <section className="w-full max-w-md rounded-main bg-if-card p-8 text-center shadow-card border border-white/5">
        <div className="mb-6 flex justify-center">
          {status === 'loading' && <Loader2 className="h-16 w-16 animate-spin text-if-olive" />}
          {status === 'success' && <CheckCircle2 className="h-16 w-16 text-green-500" />}
          {status === 'error' && <XCircle className="h-16 w-16 text-rose-500" />}
        </div>
        
        <h1 className="mb-4 text-2xl font-black tracking-tight">
          Verificação de E-mail
        </h1>
        
        <p className="mb-8 text-if-text/70">
          {message}
        </p>

        {status === 'success' ? (
          <Link
            href="/login"
            className="inline-block w-full rounded-full bg-if-olive px-6 py-3 font-bold text-if-bg transition hover:brightness-110 active:scale-95"
          >
            Fazer Login
          </Link>
        ) : status === 'error' ? (
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="inline-block w-full rounded-full bg-white/5 px-6 py-3 font-bold text-white transition hover:bg-white/10 active:scale-95 border border-white/10"
            >
              Voltar ao Login
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
