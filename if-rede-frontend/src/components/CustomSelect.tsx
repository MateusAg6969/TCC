'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

type Option = {
  value: string;
  label: string;
};

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function CustomSelect({ options, value, onChange, placeholder = 'Selecione...' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-if-olive/50 transition-all text-left"
      >
        <span className={selectedOption ? 'text-if-text' : 'text-if-text/50 font-normal'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-if-text/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-if-card/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
              {options.length === 0 ? (
                <div className="p-3 text-sm text-if-text/50 text-center">Nenhuma opção disponível</div>
              ) : (
                options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg p-3 text-sm transition-colors ${
                      String(opt.value) === String(value)
                        ? 'bg-if-olive/20 text-if-olive font-bold'
                        : 'text-if-text/80 hover:bg-white/5 font-medium'
                    }`}
                  >
                    {opt.label}
                    {String(opt.value) === String(value) && <Check size={16} />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
