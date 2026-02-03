import React, { useState } from 'react';
import { User, Match, UserRole } from '../types';
import { MOCK_TEAMS } from '../constants';
import { dbService } from '../services/database';

interface ProfileProps {
  user: User;
  matches: Match[];
  onUpdateUser?: (updatedUser: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, matches, onUpdateUser }) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const handleCreateTeam = async () => {
    setCreateError('');
    
    if (!newTeamName.trim()) {
        setCreateError('O nome do time não pode estar vazio.');
        return;
    }

    if (newTeamName.length < 3) {
        setCreateError('O nome deve ter pelo menos 3 caracteres.');
        return;
    }

    // UNIQUE CHECK (Using Local Mock + DB Check ideally, but assuming Mock list is updated for now or relying on DB constraint catch)
    const nameExists = MOCK_TEAMS.some(t => t.name.toLowerCase() === newTeamName.trim().toLowerCase());
    if (nameExists) {
        setCreateError('Este nome de time já existe. Escolha outro.');
        return;
    }

    setIsCreatingTeam(true);

    try {
        const newTeamId = `t-${Date.now()}`;
        
        // 1. Create New Team Object
        const newTeam = {
            id: newTeamId,
            name: newTeamName.trim(),
            logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(newTeamName)}&background=random&length=2`,
            wins: 0,
            losses: 0,
            draws: 0,
            territoryColor: '#ffffff', // User can change later
            players: [user], // Owner is first player
            ownerId: user.id,
            category: 'Society' as const, // Default
            homeTurf: 'Sem Local'
        };

        // 2. Save to Real Database
        const teamCreated = await dbService.createTeam(newTeam);
        
        if (!teamCreated) {
            throw new Error("Falha ao criar time no banco de dados.");
        }

        // 3. Update User Role in Real Database
        const userUpdated = await dbService.updateUserTeamAndRole(user.id, newTeamId, UserRole.OWNER);

        if (!userUpdated) {
             throw new Error("Time criado, mas falha ao atualizar usuário.");
        }

        // 4. Update Local State (Mocks for instant UI feedback + Global App State)
        // @ts-ignore
        MOCK_TEAMS.push(newTeam); // Keep mock sync for now until full DB fetch is implemented in App.tsx

        const updatedUser = { ...user, role: UserRole.OWNER, teamId: newTeamId };
        if (onUpdateUser) {
            onUpdateUser(updatedUser);
        }

        setIsCreatingTeam(false);
        setNewTeamName('');
        alert(`Parabéns! Você fundou o ${newTeamName}. Agora você é um Dono de Time.`);

    } catch (error) {
        console.error(error);
        setCreateError("Erro ao criar time. Tente novamente.");
        setIsCreatingTeam(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      
      {/* --- SECTION: UPGRADE TO OWNER (Visible only to Fans/Players) --- */}
      {user.role !== UserRole.OWNER && (
         <div className="bg-gradient-to-r from-indigo-900 to-pitch-900 rounded-[2rem] p-8 border border-neon/30 shadow-[0_0_30px_rgba(57,255,20,0.1)] relative overflow-hidden animate-[fadeIn_0.5s]">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl">👑</div>
            <div className="relative z-10">
                <h2 className="text-3xl font-display font-bold text-white uppercase italic tracking-wide mb-2">Modo Carreira</h2>
                <p className="text-gray-300 mb-6 max-w-md">Você está assistindo da arquibancada. Quer entrar em campo e dominar seu bairro? Funde seu próprio time hoje.</p>
                
                <div className="bg-black/40 p-6 rounded-2xl border border-white/10 max-w-md">
                    <label className="block text-neon text-xs font-bold mb-2 uppercase">Nome do Seu Novo Time</label>
                    <div className="flex flex-col gap-3">
                        <input 
                            type="text" 
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="bg-pitch-950 border border-pitch-600 rounded-lg px-4 py-3 text-white focus:border-neon focus:outline-none placeholder-gray-600 w-full"
                            placeholder="Ex: Real Osasco FC"
                        />
                        <button 
                            onClick={handleCreateTeam}
                            disabled={isCreatingTeam}
                            className="bg-neon text-pitch-950 font-bold py-3 rounded-lg shadow-neon hover:bg-white transition-colors uppercase tracking-wider"
                        >
                            {isCreatingTeam ? 'Fundando Clube...' : 'Fundar Clube Agora'}
                        </button>
                    </div>
                    {createError && (
                        <p className="text-red-400 text-sm mt-3 font-bold bg-red-900/20 p-2 rounded text-center border border-red-500/30">{createError}</p>
                    )}
                </div>
            </div>
         </div>
      )}

      {/* Player Card (Premium Holo Effect) */}
      <div className="relative mx-auto max-w-sm group perspective-1000">
         {/* Animated Glow Behind */}
         <div className="absolute -inset-1 bg-gradient-to-r from-neon via-blue-500 to-purple-600 rounded-[2.2rem] blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
         
         <div className="relative bg-pitch-950 bg-carbon rounded-[2rem] p-1 border border-white/10 shadow-2xl transform transition-transform duration-500 group-hover:rotate-1">
             {/* Card Inner Content */}
             <div className="bg-gradient-to-b from-pitch-900/80 to-black/90 rounded-[1.8rem] p-6 text-white backdrop-blur-sm relative overflow-hidden">
                 
                 {/* Background Shine */}
                 <div className="absolute top-0 right-0 w-[200%] h-full bg-gradient-to-l from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"></div>

                 <div className="flex justify-between items-start mb-4 relative z-10">
                     <div className="flex flex-col">
                        <span className="text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-neon to-green-600 leading-none filter drop-shadow-sm">
                            {user.role === UserRole.OWNER ? '92' : '75'}
                        </span>
                        <span className="text-sm uppercase font-bold text-pitch-300 tracking-widest ml-1">OVR</span>
                     </div>
                     <div className="text-right">
                         <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Flag_of_Brazil.svg" className="w-10 h-7 rounded shadow-md inline-block mb-1 border border-white/10" />
                         <p className="text-xs font-bold text-pitch-400 tracking-wide uppercase">
                             {user.role === UserRole.OWNER ? 'DONO/CAPITÃO' : 'TORCEDOR LIVRE'}
                         </p>
                     </div>
                 </div>
                 
                 <div className="relative w-48 h-48 mx-auto mb-2 z-10">
                     <div className="absolute inset-0 bg-neon/20 rounded-full blur-[50px] opacity-50"></div>
                     <img src={user.avatarUrl} className="w-full h-full object-cover drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] z-20 relative" style={{ clipPath: 'polygon(50% 0, 100% 25%, 100% 100%, 0 100%, 0 25%)' }} />
                 </div>
                 
                 <h2 className="text-4xl font-display font-bold text-center uppercase tracking-wider mb-6 pb-2 border-b border-white/10 relative z-10">
                    {user.name}
                 </h2>
                 
                 <div className="grid grid-cols-3 gap-2 text-center relative z-10">
                     <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <span className="block font-display text-2xl font-bold text-neon">{user.stats?.matchesPlayed}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Partidas</span>
                     </div>
                     <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <span className="block font-display text-2xl font-bold text-neon">{user.stats?.goals}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Gols</span>
                     </div>
                     <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <span className="block font-display text-2xl font-bold text-gold">{user.stats?.mvps}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">MVP</span>
                     </div>
                 </div>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Badges */}
        <div className="glass-card rounded-3xl p-6">
            <h3 className="text-xl font-display font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                <span>🏆</span> Sala de Troféus
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar mask-gradient-right">
                {user.badges && user.badges.length > 0 ? user.badges.map((badge, idx) => (
                    <div key={idx} className="flex-shrink-0 bg-gradient-to-br from-pitch-900 to-black p-4 rounded-2xl border border-white/10 w-28 flex flex-col items-center gap-3 text-center shadow-lg group hover:border-gold/50 transition-colors">
                        <div className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">🏆</div>
                        <span className="text-[10px] font-bold text-pitch-100 uppercase leading-tight">{badge}</span>
                    </div>
                )) : (
                    <p className="text-gray-500 text-sm italic">Nenhum troféu conquistado ainda.</p>
                )}
                
                <div className="flex-shrink-0 bg-white/5 p-4 rounded-2xl border border-white/5 border-dashed w-28 flex flex-col items-center justify-center opacity-40">
                    <div className="text-2xl mb-2">🔒</div>
                    <span className="text-[10px]">BLOQUEADO</span>
                </div>
            </div>
        </div>

        {/* Recent Form */}
        <div className="glass-card rounded-3xl p-6">
             <h3 className="text-xl font-display font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                <span>📈</span> Forma Recente
             </h3>
             <div className="space-y-3">
                 {matches.length > 0 ? matches.map(match => (
                     <div key={match.id} className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-colors group">
                         <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-lg shadow-inner ${match.homeScore > match.awayScore ? 'bg-neon text-pitch-950' : 'bg-danger text-white'}`}>
                                {match.homeScore > match.awayScore ? 'V' : 'D'}
                             </div>
                             <div>
                                 <p className="text-white font-bold text-sm group-hover:text-neon transition-colors">vs {match.awayTeamName}</p>
                                 <p className="text-[10px] text-gray-400 uppercase tracking-wide">{match.locationName}</p>
                             </div>
                         </div>
                         <span className="font-display text-2xl font-bold text-white/80 group-hover:text-white">{match.homeScore}-{match.awayScore}</span>
                     </div>
                 )) : (
                    <p className="text-gray-500 text-sm italic">Nenhuma partida registrada.</p>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};
