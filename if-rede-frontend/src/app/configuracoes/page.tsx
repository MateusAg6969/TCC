'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, Lock, Bell, Palette, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '@/components/CustomSelect';

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

export default function ConfiguracoesPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('perfil');

  // Toggle states
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [privacidade, setPrivacidade] = useState('publico');

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
    <main className="min-h-screen bg-if-bg text-if-text pb-24">
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
                  <div className="mb-8">
                    <h2 className="text-2xl font-black text-white">Aparência</h2>
                    <p className="text-if-text/60 mt-1">Customize a interface da sua rede.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-if-olive bg-if-olive/10 transition-all cursor-pointer">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-black to-gray-800 mb-4 shadow-xl border border-white/10" />
                      <span className="text-if-olive font-bold">Modo Noturno</span>
                    </button>
                    
                    <button className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-transparent bg-white/5 hover:bg-white/10 transition-all cursor-not-allowed opacity-50 relative overflow-hidden group">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white to-gray-200 mb-4 shadow-xl border border-black/10" />
                      <span className="text-white font-bold">Modo Claro</span>
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-black text-white px-3 py-1 rounded-full bg-black">Em breve</span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </section>
        </div>
      </div>
    </main>
  );
}
