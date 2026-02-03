import React from 'react';
import { Team, UserRole } from '../types';

interface TeamManagementProps {
  team: Team;
  currentUserRole: UserRole;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ team, currentUserRole }) => {
  const maxPlayers = 22;
  const currentPlayers = team.players.length;
  const isOwner = currentUserRole === UserRole.OWNER;

  return (
    <div className="space-y-8 pb-24">
      {/* Hero Header Card */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-pitch-950 border border-white/10 shadow-2xl group">
         {/* Background pattern */}
         <div className="absolute inset-0 bg-carbon opacity-40 mix-blend-overlay"></div>
         <div className="absolute inset-0 bg-gradient-to-br from-pitch-900 via-black to-black opacity-90"></div>
         
         {/* Animated Neon Glow */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-neon/10 rounded-full blur-[100px] animate-pulse-slow"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
         
         <div className="relative z-10 p-8 flex flex-col items-center text-center">
            {/* Logo Container */}
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-neon via-white to-black mb-6 shadow-neon relative group-hover:scale-105 transition-transform duration-500">
               <div className="absolute inset-0 bg-neon rounded-full blur-md opacity-50"></div>
               <img src={team.logoUrl} alt={team.name} className="relative w-full h-full rounded-full object-cover border-4 border-black bg-black" />
            </div>
            
            <h2 className="text-5xl font-display font-bold text-white uppercase italic tracking-wide mb-2 text-glow">{team.name}</h2>
            
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
               <span className="bg-white/5 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold text-neon border border-neon/30 shadow-[0_0_10px_rgba(57,255,20,0.1)] uppercase tracking-widest">Liga {team.category}</span>
               <span className="text-gray-600 text-[10px] hidden md:inline">•</span>
               <span className="bg-white/5 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold text-blue-400 border border-blue-500/30 uppercase tracking-widest">
                 📍 Base {team.homeTurf || 'Centro'}
               </span>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 w-full max-w-sm gap-0 border border-white/10 rounded-2xl bg-white/5 backdrop-blur overflow-hidden divide-x divide-white/10">
               <div className="flex flex-col py-4 hover:bg-white/5 transition-colors">
                  <span className="text-3xl font-display font-bold text-white">{team.wins}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Vitórias</span>
               </div>
               <div className="flex flex-col py-4 hover:bg-white/5 transition-colors">
                  <span className="text-3xl font-display font-bold text-white">{team.draws}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Empates</span>
               </div>
               <div className="flex flex-col py-4 hover:bg-white/5 transition-colors">
                  <span className="text-3xl font-display font-bold text-white">{team.losses}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Derrotas</span>
               </div>
            </div>
         </div>
         
         {isOwner && (
             <div className="absolute top-6 right-6">
                 <button className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/20 border border-white/10 transition-colors">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                 </button>
             </div>
         )}
      </div>

      {/* Roster Section */}
      <div>
         <div className="flex justify-between items-end mb-6 px-2">
            <div>
                <h3 className="text-2xl font-display font-bold text-white uppercase tracking-wide">Elenco</h3>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-neon" style={{ width: `${(currentPlayers/maxPlayers)*100}%` }}></div>
                   </div>
                   <p className="text-xs text-gray-500 font-mono">{currentPlayers}/{maxPlayers} Registrados</p>
                </div>
            </div>
            {isOwner && (
                <button className="text-pitch-950 text-sm font-bold bg-neon px-4 py-2 rounded-lg shadow-neon hover:bg-white transition-colors flex items-center gap-2">
                    <span>+</span> CONVIDAR
                </button>
            )}
         </div>
         
         <div className="space-y-3">
             {team.players.map((player, idx) => (
                 <div key={player.id} className="flex items-center gap-4 bg-white/5 border border-white/5 hover:border-white/20 p-3 rounded-2xl relative overflow-hidden group transition-all hover:translate-x-1">
                     
                     <div className="font-display text-2xl font-bold text-white/20 w-8 text-center">{idx + 1}</div>

                     <div className="relative">
                        <img src={player.avatarUrl} className="w-12 h-12 rounded-xl bg-gray-800 object-cover border border-white/10" />
                        {player.role === UserRole.OWNER && <div className="absolute -bottom-1 -right-1 bg-gold text-black text-[8px] font-bold px-1.5 py-0.5 rounded border border-black">CPT</div>}
                     </div>
                     
                     <div className="flex-1">
                         <h4 className="text-white font-bold tracking-wide group-hover:text-neon transition-colors">{player.name}</h4>
                         <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-gray-400 uppercase bg-black/40 px-2 py-0.5 rounded">Atacante</span>
                         </div>
                     </div>
                     
                     <div className="text-right pr-4 border-l border-white/5 pl-4">
                         <span className="block text-xl font-display font-bold text-neon">{player.stats?.goals || 0}</span>
                         <span className="text-[9px] text-gray-500 uppercase tracking-widest">Gols</span>
                     </div>
                 </div>
             ))}
             
             {isOwner && Array.from({ length: Math.max(0, 3 - team.players.length) }).map((_, i) => (
               <div key={`empty-${i}`} className="flex items-center gap-4 p-3 rounded-2xl border border-dashed border-white/10 opacity-40">
                  <div className="w-8"></div>
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-lg">➕</div>
                  <span className="text-sm font-bold">Vaga Aberta</span>
               </div>
             ))}
         </div>
      </div>
      
      {/* Kit Preview */}
      <div className="glass-card p-8 rounded-[2rem] flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
              <h3 className="text-white font-display font-bold text-2xl uppercase italic">Uniforme Oficial</h3>
              <p className="text-gray-400 text-xs mb-4 max-w-[150px]">Garanta a camisa autêntica do Neon FC e apoie seu território local.</p>
              <button className="text-xs bg-white text-black font-bold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors">LOJA EM BREVE</button>
          </div>
          <div className="w-32 h-32 bg-gradient-to-br from-neon to-black rounded-2xl shadow-neon rotate-12 transform group-hover:rotate-6 transition-transform duration-500 flex items-center justify-center border border-white/10">
              <span className="text-4xl">👕</span>
          </div>
          {/* Shine effect */}
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-neon/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    </div>
  );
};