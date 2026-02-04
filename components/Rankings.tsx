import React, { useState } from 'react';
import { Team } from '../types';

interface RankingsProps {
  teams: Team[];
}

export const Rankings: React.FC<RankingsProps> = ({ teams }) => {
  // Updated filter state to include new scopes
  const [filter, setFilter] = useState<'mundial' | 'nacional' | 'estado' | 'cidade' | 'bairro'>('cidade');
  
  // Find current user's team context (for filtering reference)
  const myTeam = teams.find(t => t.id === localStorage.getItem('fut_dom_user_team_id')) || teams[0];
  
  const referenceLocation = {
      country: 'Brasil', // Hardcoded scope for Nacional
      city: myTeam?.city || 'São Paulo',
      state: myTeam?.state || 'SP',
      neighborhood: myTeam?.neighborhood || 'Centro'
  };

  const filteredTeams = teams.filter(team => {
      // Mundial shows everyone
      if (filter === 'mundial') return true;

      // Nacional shows everyone valid (assuming app is currently BR only)
      // We check if they have at least a state registered to be considered "Active" in the country list
      if (filter === 'nacional') return !!team.state;

      // Legacy/Incomplete data handling: If strict location missing, hide from strict lists
      if (!team.city || !team.state) return false;
      
      if (filter === 'estado') return team.state === referenceLocation.state;
      if (filter === 'cidade') return team.city === referenceLocation.city;
      if (filter === 'bairro') return team.neighborhood === referenceLocation.neighborhood && team.city === referenceLocation.city;
      return true;
  });

  // Sort filtered teams by wins
  const sortedTeams = [...filteredTeams].sort((a, b) => b.wins - a.wins);
  const top3 = sortedTeams.slice(0, 3);
  const rest = sortedTeams.slice(3);

  // Helper for dynamic header title
  const getHeaderTitle = () => {
      switch(filter) {
          case 'mundial': return 'Ranking Global';
          case 'nacional': return 'Brasil';
          case 'estado': return referenceLocation.state;
          case 'cidade': return referenceLocation.city;
          case 'bairro': return referenceLocation.neighborhood;
          default: return 'Ranking';
      }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header Context */}
      <div className="text-center mb-4 pt-4">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Classificação Oficial</p>
          <h2 className="text-3xl font-display font-bold text-white uppercase italic tracking-wide text-glow">
              {getHeaderTitle()}
          </h2>
      </div>

      {/* Filters Segmented Control - Scrollable on Mobile */}
      <div className="flex justify-center mb-8 px-4">
         <div className="bg-pitch-950/80 backdrop-blur-xl rounded-2xl p-1.5 flex gap-1 border border-white/10 shadow-lg relative z-20 overflow-x-auto max-w-full no-scrollbar snap-x">
            {(['mundial', 'nacional', 'estado', 'cidade', 'bairro'] as const).map(f => (
               <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase transition-all duration-300 whitespace-nowrap snap-center ${
                      filter === f 
                      ? 'bg-neon text-pitch-950 shadow-[0_0_15px_rgba(57,255,20,0.4)]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
               >
                  {f}
               </button>
            ))}
         </div>
      </div>

      {sortedTeams.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-3xl mx-4 border border-dashed border-white/10">
              <span className="text-4xl block mb-2 opacity-50">🌍</span>
              <p className="text-gray-400 font-bold">Nenhum time encontrado.</p>
              <p className="text-xs text-gray-600 mt-1">Seja o primeiro a dominar esta região!</p>
          </div>
      ) : (
        <>
        {/* Podium Section */}
        <div className="relative h-80 mb-12 flex justify-center items-end px-4 gap-2 md:gap-6">
            
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm h-64 bg-neon/10 blur-[80px] rounded-full pointer-events-none"></div>

            {/* 2nd Place */}
            {top3[1] && (
                <div className="flex flex-col items-center w-1/3 animate-[slideUp_0.6s_ease-out_0.2s_both]">
                    <div className="relative mb-3 group cursor-pointer">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] bg-gradient-to-b from-gray-300 to-gray-600 shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
                            <img src={top3[1].logoUrl} className="w-full h-full rounded-full object-cover bg-black" />
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-pitch-950 font-display font-bold text-xl w-7 h-7 flex items-center justify-center rounded-full border-2 border-pitch-950 shadow-lg">2</div>
                    </div>
                    <div className="text-center mb-2">
                        <p className="text-xs md:text-sm font-bold text-gray-200 truncate max-w-[100px]">{top3[1].name}</p>
                        <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">{top3[1].wins} Vitórias</span>
                    </div>
                    <div className="w-full h-24 bg-gradient-to-t from-gray-900/80 to-gray-600/20 rounded-t-2xl border-t border-gray-500/30 backdrop-blur-sm"></div>
                </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
                <div className="flex flex-col items-center w-1/3 z-10 -mb-4 animate-[slideUp_0.6s_ease-out]">
                    <div className="relative mb-4 group cursor-pointer">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl animate-bounce drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">👑</div>
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full p-[3px] bg-gradient-to-b from-yellow-300 via-gold to-yellow-800 shadow-[0_0_30px_rgba(251,191,36,0.3)] group-hover:scale-105 transition-transform">
                            <img src={top3[0].logoUrl} className="w-full h-full rounded-full object-cover bg-black" />
                        </div>
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gold text-pitch-950 font-display font-bold text-3xl w-10 h-10 flex items-center justify-center rounded-full border-4 border-pitch-950 shadow-xl">1</div>
                    </div>
                    <div className="text-center mb-2">
                        <p className="text-sm md:text-lg font-bold text-gold truncate max-w-[120px] drop-shadow-md">{top3[0].name}</p>
                        <span className="text-xs bg-gold/20 text-gold px-3 py-0.5 rounded-full border border-gold/30 font-bold">{top3[0].wins} Vitórias</span>
                    </div>
                    <div className="w-full h-36 bg-gradient-to-t from-yellow-900/60 to-gold/10 rounded-t-2xl border-t border-gold/30 backdrop-blur-md relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(251,191,36,0.1)_50%,transparent_100%)] opacity-30 animate-shimmer" style={{backgroundSize: '200% 100%'}}></div>
                    </div>
                </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
                <div className="flex flex-col items-center w-1/3 animate-[slideUp_0.6s_ease-out_0.4s_both]">
                    <div className="relative mb-3 group cursor-pointer">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] bg-gradient-to-b from-orange-400 to-orange-800 shadow-[0_0_20px_rgba(194,65,12,0.1)] group-hover:scale-105 transition-transform">
                            <img src={top3[2].logoUrl} className="w-full h-full rounded-full object-cover bg-black" />
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white font-display font-bold text-xl w-7 h-7 flex items-center justify-center rounded-full border-2 border-pitch-950 shadow-lg">3</div>
                    </div>
                    <div className="text-center mb-2">
                        <p className="text-xs md:text-sm font-bold text-gray-300 truncate max-w-[100px]">{top3[2].name}</p>
                        <span className="text-[10px] bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded border border-orange-700">{top3[2].wins} Vitórias</span>
                    </div>
                    <div className="w-full h-16 bg-gradient-to-t from-gray-900/80 to-orange-900/20 rounded-t-2xl border-t border-orange-700/30 backdrop-blur-sm"></div>
                </div>
            )}
        </div>

        {/* Rankings List */}
        <div className="space-y-3 px-1">
            {rest.map((team, idx) => (
                <div 
                    key={team.id} 
                    className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 hover:border-neon/30 transition-all duration-300 group shadow-lg backdrop-blur-md"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                >
                    {/* Rank Number */}
                    <div className="w-8 text-center font-display text-xl font-bold text-gray-500 group-hover:text-white transition-colors">
                        {idx + 4}
                    </div>

                    {/* Avatar */}
                    <div className="relative w-12 h-12 flex-shrink-0">
                        <img src={team.logoUrl} className="w-full h-full rounded-full object-cover border border-white/10 group-hover:border-neon transition-colors" />
                        {/* Mini Territory Badge */}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-black flex items-center justify-center text-[8px]" style={{backgroundColor: team.territoryColor}}>📍</div>
                    </div>

                    {/* Team Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-bold truncate group-hover:text-neon transition-colors">{team.name}</h4>
                            {/* Location Pill */}
                            <span className="bg-green-900/60 text-green-400 border border-green-500/30 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                {team.neighborhood || team.homeTurf}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">Liga {team.category} • {team.players.length} Jogadores</p>
                    </div>

                    {/* Wins Stat */}
                    <div className="text-right px-2">
                        <span className="block font-display text-2xl font-bold text-white group-hover:text-neon transition-colors leading-none">{team.wins}</span>
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Vitórias</span>
                    </div>
                </div>
            ))}

            {rest.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                    Sem mais times no ranking desta região.
                </div>
            )}
        </div>
        </>
      )}
    </div>
  );
};