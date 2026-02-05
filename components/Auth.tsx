import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { dbService } from '../services/database';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- Login / Register Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    try {
        if (isRegistering) {
            // --- REGISTRATION LOGIC (DB) ---
            const newUser: User = {
                id: `u-${Date.now()}`,
                name: cleanName,
                email: cleanEmail,
                role: UserRole.FAN,
                teamId: undefined,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random`,
                bio: 'Novo usuário no Fut-Domination.',
                location: 'Brasil',
                following: [],
                stats: { matchesPlayed: 0, goals: 0, mvps: 0, rating: 0 },
                badges: [],
                onboardingCompleted: false
            };

            await dbService.registerUser(newUser, password);
            setIsLoading(false);
            onLogin(newUser);

        } else {
            // --- LOGIN LOGIC (DB) ---
            console.log("Tentando login com:", cleanEmail);
            
            try {
                const user = await dbService.loginUser(cleanEmail);
                
                if (user) {
                    setIsLoading(false);
                    onLogin(user);
                } else {
                    setIsLoading(false);
                    // Erro genérico de "Não encontrado"
                    setError('Conta não encontrada. O banco de dados pode ter sido reiniciado. Por favor, crie a conta novamente.');
                }
            } catch (dbError: any) {
                // Captura erro específico do banco (ex: Connection Unavailable)
                const errMsg = dbError?.message || JSON.stringify(dbError);
                console.error("DB Login Error:", dbError);
                
                if (errMsg.includes("Connection unavailable") || errMsg.includes("fetch")) {
                     setIsLoading(false);
                     setError("Erro de Conexão com o Servidor. Tente novamente em instantes.");
                } else {
                     setIsLoading(false);
                     setError("Erro ao conectar. Tente recarregar a página.");
                }
            }
        }
    } catch (err: any) {
        setIsLoading(false);
        console.error("Auth Error:", err);
        
        const errorMsg = err.message || JSON.stringify(err);

        if (errorMsg.includes('UNIQUE constraint failed')) {
             setError('Este email já está cadastrado. Tente fazer login.');
        } else if (errorMsg.includes('Network Error') || errorMsg.includes('fetch') || errorMsg.includes('Connection unavailable')) {
             setError('Erro de conexão com o servidor. O banco de dados pode estar reiniciando.');
        } else {
             setError(`Erro no Sistema: ${errorMsg}`);
        }
    }
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
          <p className="text-pitch-300">
            {isRegistering ? 'Crie sua conta e entre em campo.' : 'Entre para dominar o território.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center font-bold break-words animate-pulse">
              ⚠️ {error}
            </div>
          )}

          {isRegistering && (
            <div className="animate-[fadeIn_0.3s]">
              <label className="block text-pitch-300 text-xs font-bold mb-1 uppercase">Nome Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-white focus:border-neon focus:outline-none transition-colors"
                placeholder="Ex: João da Silva"
                required={isRegistering}
              />
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
            className="w-full bg-neon text-pitch-950 font-bold py-3 rounded-xl hover:bg-pitch-500 transition-all shadow-lg shadow-neon/20 mt-6 flex justify-center uppercase tracking-widest"
          >
            {isLoading ? (
               <div className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                   <span>Processando...</span>
               </div>
            ) : (isRegistering ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div className="mt-6 text-center">
            <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-pitch-300 hover:text-white text-sm font-bold underline decoration-neon underline-offset-4 transition-colors"
            >
                {isRegistering ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastre-se'}
            </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 text-center opacity-60">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              Developed by João Layon • DS Company (Digital Solutions)
          </p>
      </div>
    </div>
  );
};