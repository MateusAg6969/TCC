'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, Lock, Bell, Palette, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '@/components/CustomSelect';
import api from '@/lib/api';
import { toast } from 'sonner';

// Preview component para mostrar as cores dinâmicas
const ThemePreview = ({ customValues }: { customValues: Record<string, string> }) => {
  return (
    <div className="w-full flex flex-col gap-3">
      <h4 className="text-sm font-bold text-white mb-1">Preview em tempo real</h4>
      <div 
        className="rounded-xl border overflow-hidden shadow-2xl flex flex-col transition-colors duration-300 min-h-[250px]"
        style={{
          backgroundColor: customValues['--brand-background'],
          borderColor: customValues['--brand-title-border'],
        }}
      >
        {/* Menu / Header Mock */}
        <div 
          className="p-3 flex items-center justify-between border-b transition-colors duration-300"
          style={{
            backgroundColor: customValues['--brand-menu-background'],
            borderColor: customValues['--brand-title-border']
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: customValues['--brand-menu-highlight'] }}>
              <div className="w-3 h-3 rounded-full transition-colors duration-300" style={{ backgroundColor: customValues['--brand-menu-logo'] }} />
            </div>
            <div className="h-2 w-16 rounded-full transition-colors duration-300" style={{ backgroundColor: customValues['--brand-menu-text'] }} />
          </div>
          <div className="h-6 w-6 rounded-full transition-colors duration-300" style={{ backgroundColor: customValues['--brand-logo-color'] }} />
        </div>

        {/* Main Content Mock */}
        <div className="p-4 flex flex-col gap-4 flex-1">
          {/* Post Card */}
          <div 
            className="rounded-xl border p-4 shadow-sm transition-colors duration-300"
            style={{
              backgroundColor: customValues['--brand-title-background'],
              borderColor: customValues['--brand-highlight-border']
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full transition-colors duration-300" style={{ backgroundColor: customValues['--brand-highlight'] }} />
              <div className="flex flex-col gap-1.5">
                <div className="h-2 w-24 rounded-full transition-colors duration-300" style={{ backgroundColor: customValues['--brand-main'] }} />
                <div className="h-1.5 w-16 rounded-full transition-colors duration-300" style={{ backgroundColor: customValues['--brand-secondary'] }} />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-1.5 w-full rounded-full transition-colors duration-300" style={{ backgroundColor: customValues['--brand-color'] }} />
              <div className="h-1.5 w-5/6 rounded-full transition-colors duration-300" style={{ backgroundColor: customValues['--brand-color'] }} />
              <div className="h-1.5 w-4/6 rounded-full transition-colors duration-300" style={{ backgroundColor: customValues['--brand-color'] }} />
            </div>
            <div className="mt-5 pt-3 border-t flex items-center gap-2" style={{ borderColor: customValues['--brand-title-border'] }}>
               <div className="h-7 w-20 rounded-lg transition-colors duration-300" style={{ backgroundColor: customValues['--brand-highlight'] }} />
               <div className="h-7 w-20 rounded-lg transition-colors duration-300" style={{ backgroundColor: customValues['--brand-highlight-border'] }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type Tab = 'perfil' | 'privacidade' | 'notificacoes' | 'aparencia';

function ToggleSwitch({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <button 
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${checked ? 'bg-if-olive' : 'bg-white/10'}`}
    >
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`w-4 h-4 rounded-full bg-white shadow-sm ${checked ? 'ml-auto' : 'mr-auto'}`}
      />
    </button>
  );
}

type Theme = {
  id: string;
  name: string;
  className: string;
  bg: string;
  main: string;
  highlight: string;
  titleBg: string;
  menuBg: string;
};

const THEMES: Theme[] = [
  { id: 'default', name: 'Original (IF REDE)', className: 'theme-default', bg: '#190E1A', main: '#F2F2F2', highlight: '#ADCC5A', titleBg: '#2A172B', menuBg: '#2A172B' },
  { id: 'pi_light', name: 'Pi Light', className: 'theme-pi_light', bg: '#FFFFFF', main: '#000000', highlight: '#0500AD', titleBg: '#FFBB00', menuBg: '#0500AD' },
  { id: 'dark', name: 'Dark Mode', className: 'theme-dark', bg: '#000000', main: '#FFFFFF', highlight: '#FFBB00', titleBg: '#FFBB00', menuBg: '#FFBB00' },
  { id: 'pi_classic', name: 'Pi Classic', className: 'theme-pi_classic', bg: '#0500AD', main: '#ffffff', highlight: '#FFBB00', titleBg: '#FFBB00', menuBg: '#0500AD' },
  { id: 'pink_and_red', name: 'Pink & Red', className: 'theme-pink_and_red', bg: '#DE0000', main: '#ffffff', highlight: '#FFB6C1', titleBg: '#FF10F0', menuBg: '#FFB6C1' },
  { id: 'reggae', name: 'Reggae', className: 'theme-reggae', bg: '#00A726', main: '#000000', highlight: '#DE0000', titleBg: '#FFBB00', menuBg: '#00A726' },
  { id: 'dakota', name: 'Dakota', className: 'theme-dakota', bg: '#1B003F', main: '#ffffff', highlight: '#A4FF00', titleBg: '#A4FF00', menuBg: '#1B003F' },
  { id: 'iris', name: 'Iris', className: 'theme-iris', bg: '#f211c1', main: '#ffffff', highlight: '#f7f70a', titleBg: '#ffffff', menuBg: '#f211c1' },
  { id: 'johanna', name: 'Johanna', className: 'theme-johanna', bg: '#ccfffe', main: '#2c47c9', highlight: '#2c47c9', titleBg: '#63f7f5', menuBg: '#FFBB00' },
  { id: 'caroline', name: 'Caroline', className: 'theme-caroline', bg: '#8C1C13', main: '#161925', highlight: '#BFDBF7', titleBg: '#D1CCDC', menuBg: '#8C1C13' },
  { id: 'custom', name: 'Personalizado', className: 'theme-custom', bg: '#190E1A', main: '#F2F2F2', highlight: '#ADCC5A', titleBg: '#2A172B', menuBg: '#2A172B' },
];

const CUSTOM_LABELS: Record<string, string> = {
  '--brand-background': 'Fundo do Perfil',
  '--brand-main': 'Texto Principal',
  '--brand-color': 'Texto de Corpo',
  '--brand-secondary': 'Texto Secundário',
  '--brand-highlight': 'Destaque/Botões',
  '--brand-highlight-border': 'Borda de Destaque',
  '--brand-logo-color': 'Cor do Logotipo',
  '--brand-title-background': 'Fundo do Cabeçalho',
  '--brand-title-border': 'Borda do Cabeçalho',
  '--brand-menu-background': 'Fundo do Menu',
  '--brand-menu-logo': 'Logo do Menu',
  '--brand-menu-text': 'Texto do Menu',
  '--brand-menu-highlight': 'Destaque do Menu',
};

export default function ConfiguracoesPage() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('perfil');

  // Toggle states
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [privacidade, setPrivacidade] = useState('publico');

  // Theme states
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [customValues, setCustomValues] = useState<Record<string, string>>({
    '--brand-background': '#190E1A',
    '--brand-main': '#F2F2F2',
    '--brand-color': '#F2F2F2',
    '--brand-secondary': '#A99DB0',
    '--brand-highlight': '#ADCC5A',
    '--brand-highlight-border': '#412644',
    '--brand-logo-color': '#ADCC5A',
    '--brand-title-background': '#2A172B',
    '--brand-title-border': '#412644',
    '--brand-menu-background': '#2A172B',
    '--brand-menu-logo': '#ADCC5A',
    '--brand-menu-text': '#F2F2F2',
    '--brand-menu-highlight': '#8B5CF6'
  });

  const getContrastColor = (hex: string) => {
    if (!hex) return '#ffffff';
    const cleanHex = hex.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    }
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  };

  const [salvandoCores, setSalvandoCores] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('user-theme') || 'default';
      setCurrentTheme(savedTheme);
      
      const savedCustom = localStorage.getItem('user-theme-custom-values');
      if (savedCustom) {
        try {
          const parsed = JSON.parse(savedCustom);
          setCustomValues(parsed);
          
          if (savedTheme === 'custom') {
            const html = document.documentElement;
            html.style.setProperty('--brand-highlight-text', getContrastColor(parsed['--brand-highlight'] || '#ADCC5A'));
            html.style.setProperty('--brand-card-text', getContrastColor(parsed['--brand-title-background'] || '#2A172B'));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Sync theme from database profile when logged in user details load
  useEffect(() => {
    if (user?.customizacao?.tema) {
      const dbTheme = user.customizacao.tema;
      setCurrentTheme(dbTheme);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user-theme', dbTheme);
      }

      if (dbTheme === 'custom' && user.customizacao.tema_valores_customizados) {
        const dbCustom = user.customizacao.tema_valores_customizados;
        setCustomValues(dbCustom);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user-theme-custom-values', JSON.stringify(dbCustom));
          const html = document.documentElement;
          Object.entries(dbCustom).forEach(([key, val]) => {
            html.style.setProperty(key, val as string);
          });
          html.style.setProperty('--brand-highlight-text', getContrastColor((dbCustom['--brand-highlight'] || '#ADCC5A') as string));
          html.style.setProperty('--brand-card-text', getContrastColor((dbCustom['--brand-title-background'] || '#2A172B') as string));
        }
      }
    }
  }, [user]);

  const changeTheme = async (themeName: string) => {
    setCurrentTheme(themeName);
    if (typeof window === 'undefined') return;

    const html = document.documentElement;
    // Remove any existing theme class
    const classes = html.className.split(' ');
    const cleanClasses = classes.filter(c => !c.startsWith('theme-'));
    cleanClasses.push(`theme-${themeName}`);
    html.className = cleanClasses.join(' ').trim();
    
    localStorage.setItem('user-theme', themeName);

    if (themeName === 'custom') {
      // Apply current custom values
      Object.entries(customValues).forEach(([key, val]) => {
        html.style.setProperty(key, val);
      });
      html.style.setProperty('--brand-highlight-text', getContrastColor(customValues['--brand-highlight']));
      html.style.setProperty('--brand-card-text', getContrastColor(customValues['--brand-title-background']));
    } else {
      // Clear inline custom values
      Object.keys(customValues).forEach((key) => {
        html.style.removeProperty(key);
      });
      html.style.removeProperty('--brand-highlight-text');
      html.style.removeProperty('--brand-card-text');
    }

    try {
      await api.patch('/usuarios/me', {
        customizacao: {
          tema: themeName,
          tema_valores_customizados: themeName === 'custom' ? customValues : {}
        }
      });
      
      // Update global context state
      updateUser({
        customizacao: {
          ...user?.customizacao,
          tema: themeName,
          tema_valores_customizados: themeName === 'custom' ? customValues : {}
        }
      });

      toast.success('Tema atualizado no seu perfil!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar preferência de tema.');
    }
  };

  const updateCustomValue = (key: string, value: string) => {
    const newVals = { ...customValues, [key]: value };
    setCustomValues(newVals);
    localStorage.setItem('user-theme-custom-values', JSON.stringify(newVals));
    
    if (currentTheme === 'custom') {
      document.documentElement.style.setProperty(key, value);
      if (key === '--brand-highlight') {
        document.documentElement.style.setProperty('--brand-highlight-text', getContrastColor(value));
      }
      if (key === '--brand-title-background') {
        document.documentElement.style.setProperty('--brand-card-text', getContrastColor(value));
      }
    }
  };

  const salvarCoresCustomizadas = async () => {
    setSalvandoCores(true);
    try {
      await api.patch('/usuarios/me', {
        customizacao: {
          tema: 'custom',
          tema_valores_customizados: customValues
        }
      });
      
      // Update global context state
      updateUser({
        customizacao: {
          ...user?.customizacao,
          tema: 'custom',
          tema_valores_customizados: customValues
        }
      });

      toast.success('Cores personalizadas salvas no seu perfil!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar cores customizadas no servidor.');
    } finally {
      setSalvandoCores(false);
    }
  };

  useEffect(() => {
    if (!user && !isLoggingOut) {
      router.push('/login');
    }
  }, [user, router, isLoggingOut]);

  if (!user) return null;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Erro durante o logout:', error);
      setIsLoggingOut(false);
    }
  };

  const tabs = [
    { id: 'perfil', label: 'Perfil Acadêmico', icon: User },
    { id: 'privacidade', label: 'Privacidade', icon: Lock },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'aparencia', label: 'Aparência', icon: Palette },
  ];

  return (
    <main className="min-h-screen bg-if-bg text-if-text pb-24 md:pb-8">
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        
        <header className="mb-8 flex items-center gap-4">
          <Link 
            href="/home"
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Voltar para Home"
          >
            <ArrowLeft size={18} className="text-if-text/70 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Configurações</h1>
            <p className="text-sm font-medium text-if-text/50">
              Gerencie suas preferências e conta
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 items-start">
          
          {/* SIDEBAR */}
          <aside className="flex flex-col gap-2">
            <div className="bg-if-card/50 backdrop-blur-md rounded-3xl p-3 border border-white/5 shadow-2xl flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-sm font-bold relative overflow-hidden group ${
                      isActive 
                        ? 'bg-if-olive/10 text-if-olive border border-if-olive/20' 
                        : 'text-if-text/70 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <Icon size={18} className={isActive ? 'text-if-olive' : 'text-if-text/50 group-hover:text-white transition-colors'} />
                      <span>{tab.label}</span>
                    </div>
                    {isActive && <ChevronRight size={16} className="text-if-olive relative z-10" />}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 bg-if-card/50 backdrop-blur-md rounded-3xl p-3 border border-white/5 shadow-2xl">
               <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-bold bg-red-500/5 text-red-500/80 border border-transparent hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-500 disabled:opacity-50"
              >
                <LogOut size={18} />
                {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <section className="bg-if-card/50 backdrop-blur-md rounded-3xl p-6 md:p-10 border border-white/5 shadow-2xl min-h-[400px]">
            <AnimatePresence mode="wait">
              
              {activeTab === 'perfil' && (
                <motion.div
                  key="perfil"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="space-y-6"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-black text-white">Perfil Acadêmico</h2>
                    <p className="text-if-text/60 mt-1">Configurações globais da sua identidade.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-if-text/70 mb-2">Nome de Exibição Institucional</label>
                    <input 
                      type="text" 
                      disabled
                      defaultValue={user?.nome}
                      className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-base text-if-text/50 font-medium cursor-not-allowed"
                    />
                    <p className="mt-2 text-xs font-bold text-if-text/40">O nome padrão está vinculado à base acadêmica da instituição e não pode ser alterado manualmente.</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'privacidade' && (
                <motion.div
                  key="privacidade"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="space-y-6"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-black text-white">Privacidade</h2>
                    <p className="text-if-text/60 mt-1">Controle quem tem acesso ao seu conteúdo.</p>
                  </div>
                  <div className="relative z-50">
                    <label className="block text-sm font-bold text-if-text/70 mb-2">Visibilidade Global do Perfil</label>
                    <CustomSelect 
                      options={[
                        { value: 'publico', label: '🌍 Público (Visível para toda a rede)' },
                        { value: 'privado', label: '🔒 Privado (Apenas seguidores aprovados)' }
                      ]}
                      value={privacidade}
                      onChange={(val) => setPrivacidade(val)}
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'notificacoes' && (
                <motion.div
                  key="notificacoes"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="space-y-6"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-black text-white">Notificações</h2>
                    <p className="text-if-text/60 mt-1">Como você prefere ser avisado das novidades.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-black/20 border border-white/5 hover:border-if-olive/20 transition-all">
                      <div>
                        <span className="block text-base font-bold text-white">Notificações Push</span>
                        <span className="text-sm font-medium text-if-text/50">Receber alertas instantâneos no seu navegador.</span>
                      </div>
                      <ToggleSwitch checked={pushNotif} onChange={setPushNotif} />
                    </div>

                    <div className="flex items-center justify-between p-5 rounded-2xl bg-black/20 border border-white/5 hover:border-if-olive/20 transition-all">
                      <div>
                        <span className="block text-base font-bold text-white">Resumo Semanal por E-mail</span>
                        <span className="text-sm font-medium text-if-text/50">Melhores postagens e novidades da rede na sua caixa de entrada.</span>
                      </div>
                      <ToggleSwitch checked={emailNotif} onChange={setEmailNotif} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'aparencia' && (
                <motion.div
                  key="aparencia"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="space-y-6"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-white">Aparência</h2>
                    <p className="text-if-text/60 mt-1">Personalize o tema visual do seu perfil e plataforma.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {THEMES.map((theme) => {
                      const isActive = currentTheme === theme.id;
                      const previewBg = theme.id === 'custom' ? customValues['--brand-background'] : theme.bg;
                      const previewHighlight = theme.id === 'custom' ? customValues['--brand-highlight'] : theme.highlight;
                      const previewTitleBg = theme.id === 'custom' ? customValues['--brand-title-background'] : theme.titleBg;
                      
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => changeTheme(theme.id)}
                          className={`flex flex-col p-4 rounded-2xl border-2 transition-all text-left group ${
                            isActive
                              ? 'border-if-olive bg-if-olive/5 shadow-lg shadow-if-olive/5'
                              : 'border-white/5 bg-black/20 hover:border-white/20'
                          }`}
                        >
                          <span className="text-sm font-bold text-white mb-3 block">{theme.name}</span>
                          
                          {/* Mini visual preview */}
                          <div className="w-full h-12 rounded-xl flex gap-1 p-1" style={{ backgroundColor: previewBg }}>
                            <div className="w-8 h-full rounded-lg" style={{ backgroundColor: previewTitleBg }} />
                            <div className="flex-1 h-full rounded-lg flex items-center justify-center" style={{ backgroundColor: previewHighlight + '20' }}>
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: previewHighlight }} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {currentTheme === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="rounded-2xl border border-white/10 bg-black/30 p-5 mt-6 space-y-4"
                    >
                      <h3 className="text-lg font-black text-white">Personalizar Cores</h3>
                      <p className="text-xs font-bold text-if-text/50">Altere as cores do seu tema personalizado abaixo. O preview na tela é aplicado em tempo real!</p>
                      
                      <div className="flex flex-col gap-6 pt-4">
                        {/* Preview no topo para evitar que os popups de cor o cubram */}
                        <div className="w-full max-w-lg mx-auto">
                          <ThemePreview customValues={customValues} />
                        </div>

                        {/* Seletor de Cores */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.keys(customValues).map((key) => (
                            <div key={key} className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 gap-2">
                              <span className="text-xs font-bold text-if-text/80 break-words flex-1 min-w-[100px] leading-tight">{CUSTOM_LABELS[key] || key}</span>
                              <div className="flex items-center gap-2 shrink-0 ml-auto">
                                <span className="text-xs font-mono text-if-text/40">{customValues[key]}</span>
                                <input
                                  type="color"
                                  value={customValues[key]}
                                  onChange={(e) => updateCustomValue(key, e.target.value)}
                                  className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border-0 bg-transparent shrink-0"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-white/10">
                        <button
                          type="button"
                          onClick={salvarCoresCustomizadas}
                          disabled={salvandoCores}
                          className="px-6 py-2.5 rounded-full bg-if-olive text-if-olive-contrast font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {salvandoCores ? 'Salvando...' : 'Salvar Cores Personalizadas'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </section>
        </div>
      </div>
    </main>
  );
}
