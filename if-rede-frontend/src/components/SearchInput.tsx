'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Componente Reutilizável de Input de Busca com Histórico
 * O que faz: Gerencia input de busca, histórico local e UI de sugestões.
 * Justificativa: Centraliza a lógica para manter consistência entre Home e Busca.
 */

type Props = {
  initialValue?: string;
  placeholder?: string;
  onSearch?: (term: string) => void;
  loading?: boolean;
  autoFocus?: boolean;
  className?: string;
};

export default function SearchInput({ 
  initialValue = '', 
  placeholder = 'Buscar...', 
  onSearch, 
  loading = false,
  autoFocus = false,
  className = ''
}: Props) {
  const [query, setQuery] = useState(initialValue);
  const [historico, setHistorico] = useState<string[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza valor inicial (importante para página de busca)
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Carregar histórico
  useEffect(() => {
    const saved = localStorage.getItem('ifrede_search_history');
    if (saved) {
      try { setHistorico(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const salvarNoHistorico = useCallback((termo: string) => {
    if (!termo.trim() || termo.length < 2) return;
    const novo = [termo, ...historico.filter(h => h !== termo)].slice(0, 5);
    setHistorico(novo);
    localStorage.setItem('ifrede_search_history', JSON.stringify(novo));
  }, [historico]);

  const removerDoHistorico = (e: React.MouseEvent, termo: string) => {
    e.preventDefault(); e.stopPropagation();
    const novo = historico.filter(h => h !== termo);
    setHistorico(novo);
    localStorage.setItem('ifrede_search_history', JSON.stringify(novo));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      const val = target.value.trim();
      if (val) {
        salvarNoHistorico(val);
        if (onSearch) {
          onSearch(val);
        } else {
          router.push(`/search?q=${encodeURIComponent(val)}`);
        }
        setMostrarSugestoes(false);
        inputRef.current?.blur();
      }
    }
  };

  const handleSelectSugestao = (item: string) => {
    setQuery(item);
    salvarNoHistorico(item);
    if (onSearch) {
      onSearch(item);
    } else {
      router.push(`/search?q=${encodeURIComponent(item)}`);
    }
    setMostrarSugestoes(false);
  };

  return (
    <div className={`relative group w-full ${className}`}>
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-if-text/40 group-focus-within:text-if-purple transition-colors z-20">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={query}
        onFocus={() => setMostrarSugestoes(true)}
        onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
        onChange={(e) => {
          setQuery(e.target.value);
          onSearch?.(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        name="ifrede_global_search"
        className="w-full bg-black/25 border border-white/5 rounded-full py-3 pl-12 pr-12 outline-none focus:border-if-purple/40 focus:ring-4 focus:ring-if-purple/5 transition-all text-sm font-medium placeholder:text-if-text/30 z-10"
        placeholder={placeholder}
        autoFocus={autoFocus}
      />

      {query && (
        <button 
          onClick={() => { setQuery(''); onSearch?.(''); }}
          aria-label="Limpar busca"
          className="absolute inset-y-0 right-4 flex items-center text-if-text/20 hover:text-if-text/60 transition-colors z-20"
        >
          <X size={18} />
        </button>
      )}

      {/* Dropdown de Histórico */}
      {mostrarSugestoes && historico.length > 0 && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-if-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-white/5 bg-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-if-text/40">Buscas Recentes</span>
          </div>
          <ul className="max-h-64 overflow-y-auto custom-scrollbar">
            {historico.map((item, idx) => (
              <li key={idx} className="group/item border-b border-white/5 last:border-0">
                <div className="flex items-center justify-between hover:bg-if-purple/10 transition-colors">
                  <button
                    onClick={() => handleSelectSugestao(item)}
                    aria-label={`Buscar por ${item}`}
                    className="flex-1 flex items-center gap-3 px-4 py-3 text-left"
                  >
                    <Search size={12} className="text-if-text/20" />
                    <span className="text-sm font-bold text-if-text/70">{item}</span>
                  </button>
                  <button
                    onClick={(e) => removerDoHistorico(e, item)}
                    aria-label={`Remover ${item} do histórico`}
                    className="mr-2 p-1.5 rounded-lg hover:bg-red-500/20 text-if-text/20 hover:text-red-500 transition-all opacity-0 group-hover/item:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
