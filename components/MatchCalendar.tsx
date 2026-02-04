import React, { useState } from 'react';
import { Match, Team, User } from '../types';

interface MatchCalendarProps {
  matches: Match[];
  teams: Team[];
  currentUser: User;
}

export const MatchCalendar: React.FC<MatchCalendarProps> = ({ matches, teams, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Helper to get team logo
  const getTeamLogo = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.logoUrl;
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || "Desconhecido";
  };

  const relevantMatches = matches.filter(match => {
      // 1. Filter by Scope (All vs Mine)
      if (scope === 'mine') {
          const myTeamId = currentUser.teamId;
          // Matches where user is player/owner
          const isMyTeam = myTeamId ? (match.homeTeamId === myTeamId || match.awayTeamId === myTeamId) : false;
          // Matches user follows
          const isFollowing = currentUser.following.includes(match.homeTeamId) || (match.awayTeamId && currentUser.following.includes(match.awayTeamId));
          
          return isMyTeam || isFollowing;
      }
      // 'all' returns everything
      return true; 
  });

  const now = new Date();

  // Upcoming: Future dates OR status is SCHEDULED
  const upcomingMatches = relevantMatches
      .filter(m => new Date(m.date) >= now || m.status === 'SCHEDULED')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Past: Past dates AND status is FINISHED
  const pastMatches = relevantMatches
      .filter(m => new Date(m.date) < now && m.status !== 'SCHEDULED')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayMatches = activeTab === 'upcoming' ? upcomingMatches : pastMatches;

  const renderMatchCard = (match: Match) => {
      const dateObj = new Date(match.date);
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
      const time = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const isHome = match.homeTeamId === currentUser.teamId;
      const isScheduled = match.status === 'SCHEDULED';
      
      let resultColor = 'border-gray-700 bg-gray-800/50';
      let resultLabel = '';
      
      if (!isScheduled) {
          const myScore = isHome ? match.homeScore || 0 : match.awayScore || 0;
          const oppScore = isHome ? match.awayScore || 0 : match.homeScore || 0;
          
          // Only show Win/Loss label if it's explicitly "My Game" context, otherwise just show score for neutrals
          const myTeamId = currentUser.teamId;
          const isParticipant = myTeamId && (match.homeTeamId === myTeamId || match.awayTeamId === myTeamId);

          if (isParticipant) {
              if (myScore > oppScore) {
                  resultColor = 'border-green-500/50 bg-green-900/20';
                  resultLabel = 'VITÓRIA';
              } else if (myScore < oppScore) {
                  resultColor = 'border-red-500/50 bg-red-900/20';
                  resultLabel = 'DERROTA';
              } else {
                  resultLabel = 'EMPATE';
              }
          }
      }

      const homeLogo = getTeamLogo(match.homeTeamId);
      const awayLogo = match.awayTeamId ? getTeamLogo(match.awayTeamId) : null;
      const homeName = getTeamName(match.homeTeamId);

      return (
          <div key={match.id} className={`relative flex flex-col md:flex-row items-stretch bg-pitch-900 border rounded-2xl overflow-hidden mb-4 transition-all hover:scale-[1.01] ${!isScheduled && activeTab === 'past' && resultLabel ? resultColor : 'border-white/10 hover:border-neon/30'}`}>
              
              {/* Date Strip */}
              <div className={`flex flex-row md:flex-col items-center justify-center p-4 min-w-[80px] ${isScheduled || activeTab === 'upcoming' ? 'bg-neon text-pitch-950' : 'bg-black/40 text-gray-400'} font-display font-bold`}>
                  <span className="text-3xl leading-none">{day}</span>
                  <span className="text-sm tracking-widest">{month}</span>
              </div>

              {/* Match Content */}
              <div className="flex-1 p-4 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                           <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-bold text-gray-400 uppercase border border-white/5">
                               {time}
                           </span>
                           <span className="text-xs text-gray-300 font-bold truncate max-w-[150px] flex items-center gap-1">
                               <span>📍</span> {match.locationName}
                           </span>
                      </div>
                      {!isScheduled && resultLabel && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${resultLabel === 'VITÓRIA' ? 'text-green-400 bg-green-900/40' : resultLabel === 'DERROTA' ? 'text-red-400 bg-red-900/40' : 'text-gray-300 bg-gray-700'}`}>
                              {resultLabel}
                          </span>
                      )}
                      {match.status === 'SCHEDULED' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase text-neon bg-neon/10 border border-neon/30">
                              Agendado
                          </span>
                      )}
                      {match.status === 'PENDING' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase text-yellow-500 bg-yellow-900/20 border border-yellow-500/30">
                              Pendente
                          </span>
                      )}
                  </div>

                  {/* Teams & Score */}
                  <div className="flex items-center justify-between">
                      {/* Home */}
                      <div className="flex flex-col items-center w-1/3">
                          <img src={homeLogo || 'https://via.placeholder.com/50'} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black border border-white/10 object-cover mb-2" />
                          <span className="text-xs md:text-sm font-bold text-white text-center leading-tight">{homeName}</span>
                      </div>

                      {/* VS / Score */}
                      <div className="w-1/3 flex flex-col items-center justify-center">
                          {!isScheduled && match.status !== 'PENDING' ? (
                              <div className="flex items-center gap-2 md:gap-4 font-display font-bold text-3xl md:text-5xl text-white">
                                  <span>{match.homeScore}</span>
                                  <span className="text-gray-600 text-xl">-</span>
                                  <span>{match.awayScore}</span>
                              </div>
                          ) : (
                              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-gray-500 font-display font-bold text-xl border border-white/10 flex-col">
                                  <span className="text-[10px] uppercase">Às</span>
                                  {time}
                              </div>
                          )}
                      </div>

                      {/* Away */}
                      <div className="flex flex-col items-center w-1/3">
                          {awayLogo ? (
                             <img src={awayLogo} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black border border-white/10 object-cover mb-2" />
                          ) : (
                             <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-800 flex items-center justify-center text-xl mb-2">🛡️</div>
                          )}
                          <span className="text-xs md:text-sm font-bold text-white text-center leading-tight">{match.awayTeamName}</span>
                      </div>
                  </div>
              </div>

              {/* Action Button */}
              <div className="p-4 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/5 bg-white/5">
                  <button 
                      onClick={() => setSelectedMatch(match)}
                      className="bg-pitch-950 hover:bg-neon hover:text-pitch-950 text-white border border-white/20 hover:border-neon px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all w-full md:w-auto"
                  >
                      Detalhes
                  </button>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6 pb-24 max-w-3xl mx-auto relative">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-display font-bold text-white uppercase italic tracking-wide">
                        Calendário <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-green-600">Oficial</span>
                    </h2>
                    <p className="text-sm text-gray-400">Acompanhe a jornada dos times rumo à glória.</p>
                </div>

                {/* Main Filter (Upcoming vs Results) */}
                <div className="bg-pitch-900 p-1 rounded-xl border border-white/10 flex self-start md:self-auto">
                    <button 
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'upcoming' ? 'bg-neon text-pitch-950 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Próximos
                    </button>
                    <button 
                        onClick={() => setActiveTab('past')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'past' ? 'bg-white text-pitch-950 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Resultados
                    </button>
                </div>
            </div>

            {/* Scope Filter (All vs Mine) */}
            <div className="flex gap-2">
                <button 
                    onClick={() => setScope('all')}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all ${
                        scope === 'all' 
                        ? 'bg-white/10 border-white text-white' 
                        : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-500'
                    }`}
                >
                    🌎 Todos os Jogos
                </button>
                <button 
                    onClick={() => setScope('mine')}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all ${
                        scope === 'mine' 
                        ? 'bg-blue-500/20 border-blue-400 text-blue-400' 
                        : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-500'
                    }`}
                >
                    👤 Meus Jogos
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="animate-[fadeIn_0.3s_ease-out]">
            {displayMatches.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <span className="text-5xl block mb-4 opacity-30">📅</span>
                    <h3 className="text-xl font-bold text-white">Nenhum jogo {activeTab === 'upcoming' ? 'agendado' : 'encontrado'}</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        {scope === 'mine' 
                            ? "Você não tem jogos nesta categoria. Mude para 'Todos os Jogos' para explorar." 
                            : "Nenhuma partida encontrada no sistema."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {displayMatches.map(renderMatchCard)}
                </div>
            )}
        </div>

        {/* --- DETAILS MODAL --- */}
        {selectedMatch && (
            <div className="fixed inset-0 bg-black/95 z-[2000] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                 <div className="bg-pitch-950 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
                    {/* Background Effect */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-pitch-900 to-pitch-950 border-b border-white/5"></div>
                    
                    {/* Close Button */}
                    <button 
                        onClick={() => setSelectedMatch(null)}
                        className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/50 rounded-full text-white hover:bg-white/20"
                    >
                        ✕
                    </button>

                    <div className="relative z-10 p-6">
                        <div className="text-center mb-6">
                            <span className="bg-black/50 text-gray-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-white/10">
                                {new Date(selectedMatch.date).toLocaleDateString()} • {new Date(selectedMatch.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>

                        {/* Matchup Large */}
                        <div className="flex justify-between items-center mb-8">
                             <div className="flex flex-col items-center w-1/3">
                                <img src={getTeamLogo(selectedMatch.homeTeamId) || 'https://via.placeholder.com/50'} className="w-20 h-20 rounded-full bg-black border-2 border-neon/50 object-cover mb-2 shadow-neon" />
                                <h3 className="font-bold text-white text-center leading-tight">{getTeamName(selectedMatch.homeTeamId)}</h3>
                             </div>

                             <div className="flex flex-col items-center">
                                 {selectedMatch.status === 'FINISHED' ? (
                                     <div className="text-5xl font-display font-bold text-white tracking-widest">
                                         {selectedMatch.homeScore}-{selectedMatch.awayScore}
                                     </div>
                                 ) : (
                                     <div className="text-3xl font-display font-bold text-gray-500">VS</div>
                                 )}
                                 <span className={`text-[10px] uppercase font-bold mt-2 px-2 py-0.5 rounded ${
                                     selectedMatch.status === 'FINISHED' ? 'bg-white/10 text-gray-300' : 
                                     selectedMatch.status === 'SCHEDULED' ? 'bg-neon/20 text-neon' : 'bg-yellow-900/20 text-yellow-500'
                                 }`}>
                                     {selectedMatch.status === 'FINISHED' ? 'Finalizado' : selectedMatch.status === 'SCHEDULED' ? 'Agendado' : 'Pendente'}
                                 </span>
                             </div>

                             <div className="flex flex-col items-center w-1/3">
                                <img src={(selectedMatch.awayTeamId ? getTeamLogo(selectedMatch.awayTeamId) : null) || 'https://via.placeholder.com/50'} className="w-20 h-20 rounded-full bg-black border-2 border-white/10 object-cover mb-2" />
                                <h3 className="font-bold text-white text-center leading-tight">{selectedMatch.awayTeamName}</h3>
                             </div>
                        </div>

                        {/* Location Link */}
                        <a 
                           href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedMatch.locationName)}`}
                           target="_blank"
                           rel="noreferrer"
                           className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/10 transition-colors mb-6 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-pitch-900 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📍</div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Local da Partida</p>
                                    <p className="text-white font-bold">{selectedMatch.locationName}</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-500 group-hover:text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>

                        {/* Goals List (if any) */}
                        {selectedMatch.goals && selectedMatch.goals.length > 0 && (
                            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 border-b border-white/5 pb-2">Gols da Partida</h4>
                                <div className="space-y-2">
                                    {selectedMatch.goals.map((g, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-white">
                                            <span>⚽</span>
                                            <span className="font-bold">{g.playerName}</span>
                                            {g.minute && <span className="text-gray-500 text-xs">({g.minute}')</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {selectedMatch.status === 'FINISHED' && (!selectedMatch.goals || selectedMatch.goals.length === 0) && (
                            <p className="text-center text-xs text-gray-600 italic">Nenhum detalhe de gols registrado.</p>
                        )}

                    </div>
                 </div>
            </div>
        )}
    </div>
  );
};