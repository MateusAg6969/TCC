'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Sparkles, X } from 'lucide-react';

export default function ChangelogPopup() {
  const [changelog, setChangelog] = useState<{ text: string; date: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkChangelog = async () => {
      try {
        const res = await api.get('/sistema/status');
        if (mounted && res.data.data) {
          const { changelog, changelog_date } = res.data.data;
          
          if (changelog && changelog_date) {
            const seenDate = localStorage.getItem('last_changelog_date');
            if (seenDate !== changelog_date) {
              setChangelog({ text: changelog, date: changelog_date });
              setIsOpen(true);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao checar changelog:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Delay checking slightly to ensure UI is ready and not jarring
    const timer = setTimeout(() => {
      checkChangelog();
    }, 1500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (changelog?.date) {
      localStorage.setItem('last_changelog_date', changelog.date);
    }
  };

  if (loading || !isOpen || !changelog) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-if-card border-2 border-if-purple/30 rounded-3xl p-6 max-w-lg w-full flex flex-col animate-in zoom-in-95 duration-500 shadow-2xl overflow-hidden relative">
        
        {/* Header Decorativo */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-if-purple via-pink-500 to-amber-500"></div>

        <div className="flex justify-between items-start mb-6 mt-2">
          <div className="flex items-center gap-3 text-if-purple">
            <div className="p-2 bg-if-purple/10 rounded-xl">
              <Sparkles size={28} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-if-text">Novidades!</h2>
              <p className="text-xs font-bold text-if-text/40 uppercase tracking-widest">
                O site foi atualizado
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
          <div className="flex flex-col gap-3 text-sm text-if-text/80 leading-relaxed">
            {changelog.text.split('\n').map((line, idx) => (
              <p key={idx} className={line.startsWith('-') ? 'ml-4 flex items-start' : 'font-bold mt-2'}>
                {line.startsWith('-') && <span className="mr-2 text-if-purple mt-0.5">•</span>}
                {line.startsWith('-') ? line.substring(1).trim() : line}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/5 flex justify-end">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl font-bold bg-if-purple hover:bg-if-purple/90 text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-if-purple/20"
          >
            Entendi, vamos lá!
          </button>
        </div>
      </div>
    </div>
  );
}
