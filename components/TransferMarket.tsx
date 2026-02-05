import React, { useState } from 'react';
import { Team, User, UserRole } from '../types';
import { dbService } from '../services/database';

interface TransferMarketProps {
    teams: Team[];
    currentUser: User;
    onViewPlayer?: (user: User) => void;
}

export const TransferMarket: React.FC<TransferMarketProps> = ({ teams, currentUser, onViewPlayer }) => {
    const [filter, setFilter] = useState('');
    const [requestedTeams, setRequestedTeams] = useState<Set<string>>(new Set());
    const [viewingTeamRoster, setViewingTeamRoster] = useState<Team | null>(null);

    // Filter teams based on search
    const filteredTeams = teams.filter(t => 
        t.name.toLowerCase().includes(filter.toLowerCase()) || 
        t.homeTurf?.toLowerCase().includes(filter.toLowerCase())
    );

    const handleRequestTrial = async (team: Team) => {
        if (currentUser.teamId) {
            alert("Você já está em um time. Saia dele antes de pedir teste em outro.");
            return;
        }

        const success = await dbService.requestTrial(currentUser.id, team.id);
        if (success) {
            setRequestedTeams(prev => new Set(prev).add(team.id));
            alert(`Pedido enviado para o dono do ${team.name}!`);
        } else {
            alert("Erro ao enviar pedido. Tente novamente.");
        }
    };

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-pitch-900 p-6 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 text-9xl opacity-10 rotate-12 select-none">⚽</div>
                <h2 className="text-3xl font-display font-bold text-white uppercase italic tracking-wide relative z-10">
                    Mercado da <span className="text-neon">Bola</span>
                </h2>
                <p className="text-gray-300 text-sm relative z-10 max-w-xs mt-2">
                    Encontre seu próximo clube. Peça testes, seja avaliado e assine contrato.
                </p>

                {/* Search Bar */}
                <div className="mt-6 relative z-10">
                    <input 
                        type="text" 
                        placeholder="Buscar por time ou bairro..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-xl p-3 pl-10 text-white focus:border-neon focus:outline-none backdrop-blur-sm placeholder-gray-400 transition-all focus:bg-black/60"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            {/* Content Switcher */}
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                <button className="bg-white text-black px-5 py-2 rounded-full font-bold text-xs shadow-[0_0_15px_rgba(255,255,255,0.3)] whitespace-nowrap hover:scale-105 transition-transform">Clubes Contratando</button>
                <button className="bg-pitch-900 text-gray-400 px-5 py-2 rounded-full font-bold text-xs border border-white/10 whitespace-nowrap hover:bg-pitch-800 hover:text-white transition-all">Jogadores Livres (Em breve)</button>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTeams.map((team, idx) => (
                    <div 
                        key={team.id} 
                        className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/20 hover:bg-white/10 transition-all group shadow-lg backdrop-blur-md animate-[fadeIn_0.3s_ease-out]"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                        {/* Logo - Click to View Roster */}
                        <div 
                            onClick={() => setViewingTeamRoster(team)}
                            className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-gray-700 to-black relative flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform cursor-pointer"
                        >
                            <img src={team.logoUrl} className="w-full h-full rounded-full object-cover border border-white/10" />
                            {/* Territory Indicator */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-pitch-900 flex items-center justify-center text-[10px]" style={{backgroundColor: team.territoryColor}}>📍</div>
                        </div>

                        {/* Info - Click to View Roster */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewingTeamRoster(team)}>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-white text-lg truncate group-hover:text-neon transition-colors">{team.name}</h3>
                                {/* Location Pill */}
                                <span className="bg-green-900/60 text-green-400 border border-green-500/30 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                    {team.homeTurf || 'Centro'}
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-1 mb-2">
                                <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">Liga {team.category}</span>
                                <span className="text-[10px] text-gray-500 font-bold ml-1">{team.players.length} Jogadores</span>
                            </div>
                            
                            {/* Stats Mini Bar */}
                            <div className="flex gap-3 text-[10px] font-mono bg-black/30 w-fit px-2 py-1 rounded-lg border border-white/5">
                                <span className="text-green-400 font-bold">{team.wins}V</span>
                                <span className="text-red-400 font-bold">{team.losses}D</span>
                                <span className="text-gray-400 font-bold">{team.draws}E</span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex flex-col gap-2">
                             {currentUser.teamId === team.id ? (
                                 <span className="text-[10px] font-bold text-neon bg-neon/10 px-2 py-1 rounded-full border border-neon/20 whitespace-nowrap">SEU TIME</span>
                             ) : (
                                 <button 
                                    onClick={() => handleRequestTrial(team)}
                                    disabled={requestedTeams.has(team.id)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg border ${
                                        requestedTeams.has(team.id) 
                                        ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed' 
                                        : 'bg-white text-black border-transparent hover:bg-neon hover:text-black hover:scale-110 hover:shadow-neon'
                                    }`}
                                    title="Pedir Teste"
                                 >
                                     {requestedTeams.has(team.id) ? (
                                         <span className="text-lg">✓</span>
                                     ) : (
                                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                     )}
                                 </button>
                             )}
                        </div>
                    </div>
                ))}

                {filteredTeams.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <p className="text-4xl mb-3">🔭</p>
                        <p className="font-bold">Nenhum time encontrado.</p>
                        <p className="text-xs mt-1">Tente buscar por outro bairro.</p>
                    </div>
                )}
            </div>

            {/* TEAM ROSTER MODAL */}
            {viewingTeamRoster && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-pitch-950 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
                            <div className="flex items-center gap-3">
                                <img src={viewingTeamRoster.logoUrl} className="w-10 h-10 rounded-full bg-black border border-white/10 object-cover" />
                                <div>
                                    <h3 className="text-white font-bold uppercase tracking-wide leading-none">{viewingTeamRoster.name}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Elenco ({viewingTeamRoster.players.length})</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingTeamRoster(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10">✕</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {viewingTeamRoster.players.length === 0 ? (
                                <p className="text-gray-500 text-center py-8 italic">Este time ainda não tem jogadores.</p>
                            ) : (
                                viewingTeamRoster.players.map(player => (
                                    <div 
                                        key={player.id} 
                                        onClick={() => onViewPlayer && onViewPlayer(player)}
                                        className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                                    >
                                        <div className="relative">
                                            <img src={player.avatarUrl} className="w-10 h-10 rounded-full object-cover bg-gray-800" />
                                            {player.role === UserRole.OWNER && <span className="absolute -top-1 -right-1 text-[10px]">👑</span>}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-bold text-sm">{player.name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-mono">{player.position || 'Jogador'} {player.shirtNumber ? `• #${player.shirtNumber}` : ''}</p>
                                        </div>
                                        {player.stats?.rating && (
                                            <div className="text-center bg-black/30 rounded p-1">
                                                <span className="block text-neon font-display text-sm font-bold leading-none">{player.stats.rating}</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* Footer Action */}
                        {!currentUser.teamId && currentUser.id !== viewingTeamRoster.ownerId && (
                            <div className="p-4 border-t border-white/10 bg-black/20">
                                <button 
                                    onClick={() => { handleRequestTrial(viewingTeamRoster); setViewingTeamRoster(null); }}
                                    className="w-full bg-neon text-black font-bold py-3 rounded-xl uppercase text-xs tracking-widest hover:bg-white transition-colors"
                                >
                                    Pedir para Jogar Aqui
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};