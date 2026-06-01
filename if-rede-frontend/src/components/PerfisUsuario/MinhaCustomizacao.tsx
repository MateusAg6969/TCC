'use client';

/**
 * MinhaCustomizacao Component
 * 
 * Panel para customizar tema visual do perfil.
 * 
 * Features:
 * - Seletor de cores (fundo e botões)
 * - Seletor de tema (claro/escuro/roxo)
 * - Preview em tempo real
 * - Paleta pré-definida de cores IF REDE
 * 
 * Identidade Visual: Roxo/Oliva com preview do tema
 */

import { useState, useEffect, useMemo } from 'react';
import { Save } from 'lucide-react';
import { useUsuario } from '@/hooks/useUsuario';
import type { CustomizacaoCompleta } from '@/types';
import ModalCarregamento from '../Common/ModalCarregamento';

interface MinhaCustomizacaoProps {
  customizacaoInicial?: CustomizacaoCompleta;
  onSucesso?: () => void;
}

const PALETA_CORES = [
  { nome: 'Roxo IF REDE', fundo: '#7C3AED', botoes: '#8F9972' },
  { nome: 'Oliva IF REDE', fundo: '#5C5D4D', botoes: '#8F9972' },
  { nome: 'Roxo Escuro', fundo: '#4C1D95', botoes: '#7C3AED' },
  { nome: 'Verde Musgo', fundo: '#2D5016', botoes: '#84CC16' },
  { nome: 'Azul Noturno', fundo: '#0C1B4D', botoes: '#3B82F6' },
  { nome: 'Rosa Escuro', fundo: '#500724', botoes: '#EC4899' },
];

const TEMAS = [
  { nome: 'Claro', valor: 'claro' as const },
  { nome: 'Escuro', valor: 'escuro' as const },
  { nome: 'Roxo', valor: 'roxo' as const },
];

export default function MinhaCustomizacao({
  customizacaoInicial = {
    cor_fundo: '#2D1B2D',
    cor_botoes: '#8F9972',
    tema: 'escuro',
  },
  onSucesso,
}: MinhaCustomizacaoProps) {
  const { loading, atualizarCustomizacao } = useUsuario();

  const [corFundo, setCorFundo] = useState(customizacaoInicial.cor_fundo || '#2D1B2D');
  const [corBotoes, setCorBotoes] = useState(customizacaoInicial.cor_botoes || '#8F9972');
  const [tema, setTema] = useState<'claro' | 'escuro' | 'roxo'>(
    customizacaoInicial.tema || 'escuro'
  );
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Resetar sucesso após 2s
  useEffect(() => {
    if (sucesso) {
      const timer = setTimeout(() => setSucesso(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [sucesso]);

  const handleAplicarPaleta = (paleta: typeof PALETA_CORES[0]) => {
    setCorFundo(paleta.fundo);
    setCorBotoes(paleta.botoes);
  };

  const handleSalvar = async () => {
    setErro(null);

    try {
      await atualizarCustomizacao({
        cor_fundo: corFundo,
        cor_botoes: corBotoes,
        tema,
      });

      setSucesso(true);
      onSucesso?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar customização';
      setErro(msg);
    }
  };

  const estiloPreview = useMemo(
    () => ({
      '--preview-bg': corFundo,
      '--preview-botoes': corBotoes,
    } as React.CSSProperties),
    [corFundo, corBotoes]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel de Controles */}
      <div className="lg:col-span-2 space-y-6">
        {/* Cores */}
        <div className="bg-if-card rounded-main border border-if-olive/30 p-6">
          <h3 className="text-lg font-bold text-if-text mb-4">Cores do Tema</h3>

          <div className="space-y-4">
            {/* Cor de Fundo */}
            <div>
              <label className="block text-if-text font-medium mb-2">
                Cor de Fundo
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={corFundo}
                  onChange={(e) => setCorFundo(e.target.value)}
                  className="w-16 h-16 rounded-main cursor-pointer border border-if-olive/30"
                />
                <div>
                  <p className="text-if-text/80 text-sm">{corFundo}</p>
                  <p className="text-if-olive/70 text-xs">Código HEX</p>
                </div>
              </div>
            </div>

            {/* Cor de Botões */}
            <div>
              <label className="block text-if-text font-medium mb-2">
                Cor de Botões e Destaques
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={corBotoes}
                  onChange={(e) => setCorBotoes(e.target.value)}
                  className="w-16 h-16 rounded-main cursor-pointer border border-if-olive/30"
                />
                <div>
                  <p className="text-if-text/80 text-sm">{corBotoes}</p>
                  <p className="text-if-olive/70 text-xs">Código HEX</p>
                </div>
              </div>
            </div>
          </div>

          {/* Paletas Pré-definidas */}
          <div className="mt-6">
            <p className="text-if-text font-medium mb-3">Paletas Recomendadas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PALETA_CORES.map((paleta, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAplicarPaleta(paleta)}
                  className="
                    p-3 rounded-lg border-2 transition-all duration-150
                    hover:border-purple-600
                  "
                  style={{
                    borderColor:
                      corFundo === paleta.fundo && corBotoes === paleta.botoes
                        ? '#8B5CF6'
                        : '#5C5D4D',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded border border-if-olive/30"
                      style={{ backgroundColor: paleta.fundo }}
                    />
                    <div
                      className="w-6 h-6 rounded border border-if-olive/30"
                      style={{ backgroundColor: paleta.botoes }}
                    />
                  </div>
                  <p className="text-xs text-if-text text-left truncate">
                    {paleta.nome}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tema */}
        <div className="bg-if-card rounded-main border border-if-olive/30 p-6">
          <h3 className="text-lg font-bold text-if-text mb-4">Tema Geral</h3>

          <div className="grid grid-cols-3 gap-3">
            {TEMAS.map((t) => (
              <button
                key={t.valor}
                onClick={() => setTema(t.valor)}
                className={`
                  p-3 rounded-lg border-2 font-medium text-sm transition-all duration-150
                  ${
                    tema === t.valor
                      ? 'border-purple-600 bg-purple-600/10 text-purple-400'
                      : 'border-if-olive/30 bg-if-bg hover:border-if-olive/50 text-if-text'
                  }
                `}
              >
                {t.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="bg-red-600/20 border border-red-600/40 rounded-main p-4 text-red-400 text-sm">
            {erro}
          </div>
        )}

        {/* Sucesso */}
        {sucesso && (
          <div className="bg-green-600/20 border border-green-600/40 rounded-main p-4 text-green-400 text-sm">
            Customização salva com sucesso!
          </div>
        )}

        {/* Botão Salvar */}
        <button
          onClick={handleSalvar}
          disabled={loading}
          className="
            w-full px-6 py-3 rounded-main
            bg-purple-600 hover:bg-purple-700
            text-if-text font-medium
            transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
        >
          <Save size={18} />
          Salvar Customização
        </button>
      </div>

      {/* Preview */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <h3 className="text-lg font-bold text-if-text mb-4">Preview</h3>

          <div
            className="rounded-main border border-if-olive/30 overflow-hidden shadow-card"
            style={estiloPreview as any}
          >
            {/* Fake Profile */}
            <div
              className="p-6 space-y-4 min-h-96"
              style={{ backgroundColor: corFundo }}
            >
              {/* Avatar Mock */}
              <div className="flex justify-center">
                <div
                  className="w-20 h-20 rounded-full border-4"
                  style={{ borderColor: corBotoes }}
                />
              </div>

              {/* Nome */}
              <div className="text-center">
                <div className="h-6 bg-white/20 rounded w-40 mx-auto mb-2" />
                <div className="h-4 bg-white/10 rounded w-32 mx-auto" />
              </div>

              {/* Botões */}
              <div className="space-y-2 mt-6">
                <button
                  className="w-full py-2 rounded-lg text-white font-medium text-sm"
                  style={{ backgroundColor: corBotoes }}
                >
                  Exemplo de Botão
                </button>
                <button
                  className="w-full py-2 rounded-lg border-2 font-medium text-sm"
                  style={{
                    borderColor: corBotoes,
                    color: corBotoes,
                  }}
                >
                  Botão Secundário
                </button>
              </div>

              {/* Cards */}
              <div className="space-y-2 mt-6">
                <div className="p-3 bg-white/10 rounded-lg">
                  <div className="h-4 bg-white/30 rounded w-full mb-2" />
                  <div className="h-3 bg-white/20 rounded w-2/3" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-if-olive/70 text-xs mt-3 text-center">
            Este é um preview de como seu perfil ficará com as cores selecionadas.
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && <ModalCarregamento mensagem="Salvando..." />}
    </div>
  );
}
