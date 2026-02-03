import React, { useState } from 'react';
import { Team } from '../types';

interface RankingsProps {
  teams: Team[];
}

export const Rankings: React.FC<RankingsProps> = ({ teams }) => {
  const [filter, setFilter] = useState<'bairro' | 'cidade' | 'estado'>('cidade');
  
  const sortedTeams = [...teams].sort((a, b) => b.wins - a.wins);
  const top3 = sortedTeams.slice(0, 3);
  const rest = sortedTeams.slice(3);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between mb-2">
         <h2 className="text-3xl font-display font-bold text-white uppercase italic">Classificação</h2>
         <div className="bg-pitch-900 rounded-lg p-1 flex gap-1 border border-pitch-800">
            {(['bairro', 'cidade', 'estado'] as const).map(f => (
               <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all ${filter === f ? 'bg-pitch-800 text-neon shadow-sm' : 'text-gray-500'}`}
               >
                  {f}
               </button>
            ))}
         </div>
      </div>

      {/* Podium */}
      <div className="flex justify-center items-end gap-4 h-64 mb-8 pt-8">
         {/* 2nd Place */}
         <div className="flex flex-col items-center w-1/3">
             <div className="relative mb-2">
                <img src={top3[1]?.logoUrl} className="w-16 h-16 rounded-full border-2 border-gray-300 shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                <div className="absolute -bottom-2 -right-2 bg-gray-300 text-black font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">2</div>
             </div>
             <p className="text-xs text-gray-300 font-bold mb-1 truncate w-full text-center">{top3[1]?.name}</p>
             <div className="w-full bg-gradient-to-t from-gray-900 to-gray-800 rounded-t-lg h-32 flex items-end justify-center pb-2 border-t border-gray-700">
                <span className="font-display text-2xl font-bold text-gray-400">{top3[1]?.wins} V</span>
             </div>
         </div>

         {/* 1st Place */}
         <div className="flex flex-col items-center w-1/3 z-10">
             <div className="relative mb-2">
                <div className="absolute -top-6 text-2xl">👑</div>
                <img src={top3[0]?.logoUrl} className="w-24 h-24 rounded-full border-4 border-gold shadow-[0_0_20px_rgba(251,191,36,0.4)]" />
                <div className="absolute -bottom-2 -right-2 bg-gold text-black font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-black">1</div>
             </div>
             <p className="text-sm text-gold font-bold mb-1 truncate w-full text-center">{top3[0]?.name}</p>
             <div className="w-full bg-gradient-to-t from-yellow-900/50 to-gold/20 rounded-t-lg h-44 flex items-end justify-center pb-4 border-t border-gold relative overflow-hidden">
                <div className="absolute inset-0 bg-gold blur-3xl opacity-10"></div>
                <span className="font-display text-4xl font-bold text-gold">{top3[0]?.wins} V</span>
             </div>
         </div>

         {/* 3rd Place */}
         <div className="flex flex-col items-center w-1/3">
             <div className="relative mb-2">
                <img src={top3[2]?.logoUrl} className="w-16 h-16 rounded-full border-2 border-orange-700 shadow-[0_0_15px_rgba(194,65,12,0.2)]" />
                <div className="absolute -bottom-2 -right-2 bg-orange-700 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">3</div>
             </div>
             <p className="text-xs text-orange-400 font-bold mb-1 truncate w-full text-center">{top3[2]?.name}</p>
             <div className="w-full bg-gradient-to-t from-gray-900 to-gray-800 rounded-t-lg h-24 flex items-end justify-center pb-2 border-t border-orange-900">
                <span className="font-display text-2xl font-bold text-orange-700">{top3[2]?.wins} V</span>
             </div>
         </div>
      </div>

      {/* List */}
      <div className="space-y-3">
         {rest.map((team, idx) => (
             <div key={team.id} className="flex items-center gap-4 bg-pitch-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                 <span className="font-display text-xl font-bold text-gray-600 w-8 text-center">{idx + 4}</span>
                 <img src={team.logoUrl} className="w-10 h-10 rounded-full" />
                 <div className="flex-1">
                     <p className="text-white font-bold">{team.name}</p>
                     <p className="text-xs text-gray-500">Liga {team.category}</p>
                 </div>
                 <span className="font-mono text-neon font-bold">{team.wins} V</span>
             </div>
         ))}
      </div>
    </div>
  );
};