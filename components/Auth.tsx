import React, { useState } from 'react';
import { UserRole } from '../types';

interface AuthProps {
  onLogin: (role: UserRole) => void;
}

type AuthStep = 'LOGIN' | 'ROLE_SELECTION' | 'SUBSCRIPTION';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [step, setStep] = useState<AuthStep>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Step 1: Login Simulation ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('ROLE_SELECTION');
    }, 1000);
  };

  // --- Step 2: Role Selection ---
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === UserRole.OWNER) {
      setStep('SUBSCRIPTION');
    } else {
      // Fan/Common user goes straight to app
      setIsLoading(true);
      setTimeout(() => onLogin(role), 800);
    }
  };

  // --- Step 3: Subscription (Owner Only) ---
  const handlePayment = () => {
    setIsLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      onLogin(UserRole.OWNER);
    }, 2000);
  };

  // --- Renders ---

  if (step === 'ROLE_SELECTION') {
    return (
      <div className="min-h-screen bg-pitch-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="max-w-4xl w-full z-10">
          <h2 className="text-4xl font-display font-bold text-white text-center mb-2">Escolha seu Caminho</h2>
          <p className="text-gray-400 text-center mb-10">Como você quer dominar o jogo?</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner Option */}
            <button 
              onClick={() => handleRoleSelect(UserRole.OWNER)}
              className="group relative bg-pitch-900 border border-neon/30 hover:border-neon rounded-3xl p-8 text-left transition-all hover:scale-[1.02] hover:shadow-neon"
            >
              <div className="absolute top-4 right-4 text-3xl">👑</div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-neon">Dono de Time</h3>
              <p className="text-gray-400 text-sm mb-6">Crie seu elenco, gerencie 22 jogadores, registre jogos e domine territórios reais.</p>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-300"><span className="text-neon">✓</span> Criar e Gerenciar Time</li>
                <li className="flex items-center gap-2 text-sm text-gray-300"><span className="text-neon">✓</span> Registrar Jogos Oficiais</li>
                <li className="flex items-center gap-2 text-sm text-gray-300"><span className="text-neon">✓</span> Dominar Zonas no Mapa</li>
              </ul>
              <div className="mt-auto inline-block bg-neon text-black font-bold px-4 py-2 rounded-lg text-sm">Selecionar Dono</div>
            </button>

            {/* Fan Option */}
            <button 
              onClick={() => handleRoleSelect(UserRole.FAN)}
              className="group relative bg-pitch-900 border border-white/10 hover:border-white/50 rounded-3xl p-8 text-left transition-all hover:scale-[1.02]"
            >
              <div className="absolute top-4 right-4 text-3xl">🎫</div>
              <h3 className="text-2xl font-bold text-white mb-2">Torcedor / Jogador</h3>
              <p className="text-gray-400 text-sm mb-6">Siga seus times locais favoritos, entre em fanclubes, veja estatísticas e confira o mapa de dominação.</p>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white">✓</span> Ver Mapa ao Vivo</li>
                <li className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white">✓</span> Entrar em Fanclubes</li>
                <li className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white">✓</span> Acompanhar Estatísticas</li>
              </ul>
              <div className="mt-auto inline-block bg-gray-700 text-white font-bold px-4 py-2 rounded-lg text-sm group-hover:bg-white group-hover:text-black transition-colors">Selecionar Torcedor</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'SUBSCRIPTION') {
    return (
      <div className="min-h-screen bg-pitch-950 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-hero-glow opacity-20 animate-pulse-slow"></div>
        
        <div className="bg-pitch-900/90 backdrop-blur-xl border border-gold/30 p-8 rounded-3xl w-full max-w-md shadow-2xl relative z-10 text-center">
           <div className="w-20 h-20 bg-gradient-to-br from-gold to-yellow-700 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
             <span className="text-4xl">🏆</span>
           </div>
           
           <h2 className="text-3xl font-display font-bold text-white mb-2">Passe de Temporada Premium</h2>
           <p className="text-gold font-bold uppercase tracking-widest text-xs mb-8">Para Donos de Time Sérios</p>

           <div className="bg-black/40 rounded-2xl p-6 mb-8 border border-white/5">
              <span className="block text-gray-400 text-sm mb-1">Assinatura Mensal</span>
              <div className="flex justify-center items-end gap-1">
                 <span className="text-sm font-bold text-gray-400 mb-2">R$</span>
                 <span className="text-6xl font-display font-bold text-white">60</span>
                 <span className="text-sm font-bold text-gray-400 mb-2">,00</span>
              </div>
           </div>

           <div className="space-y-4 mb-8 text-left">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-neon/10 flex items-center justify-center text-neon">✓</div>
                 <p className="text-sm text-gray-300">Registro de Jogos Ilimitado</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-neon/10 flex items-center justify-center text-neon">✓</div>
                 <p className="text-sm text-gray-300">Gerencie até 22 Jogadores</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-neon/10 flex items-center justify-center text-neon">✓</div>
                 <p className="text-sm text-gray-300">Histórico de Dominação de Território</p>
              </div>
           </div>

           <button 
             onClick={handlePayment}
             disabled={isLoading}
             className="w-full bg-gradient-to-r from-neon to-green-600 text-black font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all transform hover:scale-[1.02]"
           >
             {isLoading ? 'Processando Pagamento...' : 'Assinar e Criar Time'}
           </button>
           
           <button onClick={() => setStep('ROLE_SELECTION')} className="mt-4 text-sm text-gray-500 hover:text-white">Voltar para Funções</button>
        </div>
      </div>
    );
  }

  // Default: Login Screen
  return (
    <div className="min-h-screen bg-pitch-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pitch-500/10 rounded-full blur-[100px]"></div>

      <div className="bg-pitch-900 border border-pitch-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10 animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-display font-bold text-white mb-2 tracking-wider">
            FUT<span className="text-neon">-DOMINATION</span>
          </h1>
          <p className="text-pitch-300">Conquiste o campo. Domine seu bairro.</p>
        </div>

        <div className="space-y-4 mb-6">
          <button 
            onClick={() => setStep('ROLE_SELECTION')}
            className="w-full bg-white text-pitch-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
            Continuar com Google
          </button>
          <button 
             onClick={() => setStep('ROLE_SELECTION')}
             className="w-full bg-black text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
          >
            <img src="https://www.svgrepo.com/show/512317/github-142.svg" className="w-5 h-5 filter invert" alt="A" />
            Continuar com Apple
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-pitch-700 flex-1"></div>
          <span className="text-pitch-500 text-sm font-bold uppercase">Ou via Email</span>
          <div className="h-px bg-pitch-700 flex-1"></div>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-pitch-300 text-xs font-bold mb-1 uppercase">Endereço de Email</label>
            <input 
              type="email" 
              className="w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-white focus:border-neon focus:outline-none"
              placeholder="artilheiro@fut.com"
            />
          </div>
          <div>
            <label className="block text-pitch-300 text-xs font-bold mb-1 uppercase">Senha</label>
            <input 
              type="password" 
              className="w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-white focus:border-neon focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-neon text-pitch-950 font-bold py-3 rounded-xl hover:bg-pitch-500 transition-all shadow-lg shadow-neon/20 mt-6 flex justify-center"
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : 'Entrar no Vestiário'}
          </button>
        </form>
      </div>
    </div>
  );
};