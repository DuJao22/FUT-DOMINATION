import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { MOCK_AUTH_DB } from '../constants';

interface AuthProps {
  onLogin: (user: User) => void;
}

type AuthStep = 'LOGIN' | 'SUBSCRIPTION';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [step, setStep] = useState<AuthStep>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Temporary state for the flow if needed
  const [tempUser, setTempUser] = useState<User | null>(null);

  // --- Step 1: Login Logic ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const foundUser = MOCK_AUTH_DB.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (foundUser) {
        setIsLoading(false);
        // Remove password before passing user data to app state
        const { password, ...safeUser } = foundUser;
        onLogin(safeUser as User);
      } else {
        setIsLoading(false);
        setError('Email ou senha incorretos.');
      }
    }, 800);
  };

  // Helper to fill credentials for demo purposes
  const fillDemo = (role: string) => {
    if (role === 'owner') { setEmail('admin@fut.com'); setPassword('123'); }
    setError('');
  };

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
          <p className="text-pitch-300">Banco de Dados: Limpo</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-pitch-300 text-xs font-bold mb-1 uppercase">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-white focus:border-neon focus:outline-none transition-colors"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-pitch-300 text-xs font-bold mb-1 uppercase">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-white focus:border-neon focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-neon text-pitch-950 font-bold py-3 rounded-xl hover:bg-pitch-500 transition-all shadow-lg shadow-neon/20 mt-6 flex justify-center"
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : 'Iniciar Novo Jogo'}
          </button>
        </form>

        {/* Demo Helper - Useful for the user to test hierarchies */}
        <div className="mt-8 border-t border-pitch-800 pt-6">
          <p className="text-center text-gray-500 text-xs mb-4 uppercase font-bold">Acesso Inicial</p>
          <div className="flex gap-2 justify-center">
             <button onClick={() => fillDemo('owner')} className="bg-pitch-800 hover:bg-pitch-700 text-gold text-xs px-3 py-2 rounded-lg border border-gold/20">
               👑 Admin Inicial
             </button>
          </div>
          <p className="text-center text-gray-600 text-[10px] mt-2">Senha: 123</p>
        </div>
      </div>
    </div>
  );
};