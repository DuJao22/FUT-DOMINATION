import React, { useState } from 'react';
import { Match, Team, User } from '../types';

interface MatchCalendarProps {
  matches: Match[];
  teams: Team[];
  currentUser: User;
}

export const MatchCalendar: React.FC<MatchCalendarProps> = ({ matches, teams, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

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
      const myTeamId = currentUser.teamId;
      if (myTeamId) {
          return match.homeTeamId === myTeamId || match.awayTeamId === myTeamId;
      }
      if (currentUser.following.length > 0) {
          return currentUser.following.includes(match.homeTeamId) || (match.awayTeamId && currentUser.following.includes(match.awayTeamId));
      }
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

      const homeLogo = getTeamLogo(match.homeTeamId);
      const awayLogo = match.awayTeamId ? getTeamLogo(match.awayTeamId) : null;
      const homeName = getTeamName(match.homeTeamId);

      return (
          <div key={match.id} className={`relative flex flex-col md:flex-row items-stretch bg-pitch-900 border rounded-2xl overflow-hidden mb-4 transition-all hover:scale-[1.01] ${!isScheduled && activeTab === 'past' ? resultColor : 'border-white/10 hover:border-neon/30'}`}>
              
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
                      {isScheduled && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase text-neon bg-neon/10 border border-neon/30">
                              Agendado
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
                          {!isScheduled ? (
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

              {/* Action Button (Upcoming only) */}
              {(isScheduled || activeTab === 'upcoming') && (
                  <div className="p-4 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/5 bg-white/5">
                      <button className="bg-pitch-950 hover:bg-neon hover:text-pitch-950 text-white border border-white/20 hover:border-neon px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all w-full md:w-auto">
                          Detalhes
                      </button>
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="space-y-6 pb-24 max-w-3xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
                <h2 className="text-4xl font-display font-bold text-white uppercase italic tracking-wide">
                    Calendário <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-green-600">Oficial</span>
                </h2>
                <p className="text-sm text-gray-400">Acompanhe a jornada do time rumo à glória.</p>
            </div>

            {/* Tabs */}
            <div className="bg-pitch-900 p-1 rounded-xl border border-white/10 flex">
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

        {/* Content */}
        <div className="animate-[fadeIn_0.3s_ease-out]">
            {displayMatches.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <span className="text-5xl block mb-4 opacity-30">📅</span>
                    <h3 className="text-xl font-bold text-white">Nenhum jogo {activeTab === 'upcoming' ? 'agendado' : 'encontrado'}</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        {activeTab === 'upcoming' 
                            ? "Fale com o dono do time para marcar um amistoso!" 
                            : "O histórico de partidas aparecerá aqui."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {displayMatches.map(renderMatchCard)}
                </div>
            )}
        </div>
    </div>
  );
};