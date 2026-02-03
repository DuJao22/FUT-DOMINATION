import React from 'react';
import { User, Match } from '../types';

interface ProfileProps {
  user: User;
  matches: Match[];
}

export const Profile: React.FC<ProfileProps> = ({ user, matches }) => {
  return (
    <div className="space-y-8 pb-24">
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
                        <span className="text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-neon to-green-600 leading-none filter drop-shadow-sm">92</span>
                        <span className="text-sm uppercase font-bold text-pitch-300 tracking-widest ml-1">OVR</span>
                     </div>
                     <div className="text-right">
                         <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Flag_of_Brazil.svg" className="w-10 h-7 rounded shadow-md inline-block mb-1 border border-white/10" />
                         <p className="text-xs font-bold text-pitch-400 tracking-wide">ATA • NEON FC</p>
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
                {user.badges?.map((badge, idx) => (
                    <div key={idx} className="flex-shrink-0 bg-gradient-to-br from-pitch-900 to-black p-4 rounded-2xl border border-white/10 w-28 flex flex-col items-center gap-3 text-center shadow-lg group hover:border-gold/50 transition-colors">
                        <div className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">🏆</div>
                        <span className="text-[10px] font-bold text-pitch-100 uppercase leading-tight">{badge}</span>
                    </div>
                ))}
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
                 {matches.map(match => (
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
                 ))}
             </div>
        </div>
      </div>
    </div>
  );
};