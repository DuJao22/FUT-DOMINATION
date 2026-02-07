import React, { useState, useEffect } from 'react';
import { Team, User, UserRole } from '../types';
import { dbService } from '../services/database';

interface TransferMarketProps {
    teams: Team[];
    currentUser: User;
    onViewPlayer?: (user: User) => void;
}

export const TransferMarket: React.FC<TransferMarketProps> = ({ teams, currentUser, onViewPlayer }) => {
    const [filter, setFilter] = useState('');
    const [requestedItems, setRequestedItems] = useState<Set<string>>(new Set());
    const [viewingTeamRoster, setViewingTeamRoster] = useState<Team | null>(null);
    const [freeAgents, setFreeAgents] = useState<User[]>([]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);

    const isOwner = currentUser.role === UserRole.OWNER;

    useEffect(() => {
        if (isOwner) {
            setIsLoadingAgents(true);
            dbService.getFreeAgents().then(agents => {
                setFreeAgents(agents);
                setIsLoadingAgents(false);
            });
        }
    }, [isOwner, currentUser.teamId]);

    const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()) || t.homeTurf?.toLowerCase().includes(filter.toLowerCase()));
    const filteredAgents = freeAgents.filter(u => u.name.toLowerCase().includes(filter.toLowerCase()) || u.position?.toLowerCase().includes(filter.toLowerCase()));

    const handleRequestTrial = async (team: Team) => {
        if (currentUser.teamId) {
            alert("Você já está em um time. Saia dele antes de pedir teste em outro.");
            return;
        }
        const success = await dbService.requestTrial(currentUser.id, team.id);
        if (success) {
            setRequestedItems(prev => new Set(prev).add(team.id));
            alert(`Pedido enviado para o dono do ${team.name}!`);
        } else {
            alert("Erro ao enviar pedido.");
        }
    };

    const handleInvitePlayer = async (player: User) => {
        if (!currentUser.teamId) {
            alert("Você precisa ter um time criado para contratar.");
            return;
        }
        
        // REAL INVITE LOGIC
        const success = await dbService.sendTeamInvite(currentUser.teamId, player.id);
        
        if (success) {
            setRequestedItems(prev => new Set(prev).add(player.id));
            alert(`Convite enviado para ${player.name}!`);
        } else {
            alert("Erro ao enviar convite.");
        }
    };

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className={`p-6 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl ${isOwner ? 'bg-gradient-to-r from-gold/20 to-pitch-900' : 'bg-gradient-to-r from-blue-900 to-pitch-900'}`}>
                <div className="absolute top-0 right-0 text-9xl opacity-10 rotate-12 select-none">{isOwner ? '📋' : '⚽'}</div>
                <h2 className="text-3xl font-display font-bold text-white uppercase italic tracking-wide relative z-10">
                    {isOwner ? 'Central de ' : 'Mercado da '} 
                    <span className={isOwner ? 'text-gold' : 'text-neon'}>{isOwner ? 'Scout' : 'Bola'}</span>
                </h2>
                <div className="mt-6 relative z-10">
                    <input 
                        type="text" 
                        placeholder={isOwner ? "Buscar jogador..." : "Buscar time..."}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className={`w-full bg-black/40 border border-white/20 rounded-xl p-3 pl-10 text-white focus:outline-none backdrop-blur-sm placeholder-gray-400 transition-all focus:bg-black/60 ${isOwner ? 'focus:border-gold' : 'focus:border-neon'}`}
                    />
                </div>
            </div>

            {isOwner ? (
                <div className="space-y-4">
                    <h3 className="text-white font-bold uppercase tracking-widest text-xs ml-2 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-gold rounded-full animate-pulse"></span> Jogadores Disponíveis ({filteredAgents.length})
                    </h3>
                    {isLoadingAgents ? (
                        <div className="text-center py-10"><div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                    ) : filteredAgents.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10"><p className="text-gray-500 font-bold">Nenhum jogador livre.</p></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredAgents.map((agent, idx) => (
                                <div key={agent.id} onClick={() => onViewPlayer && onViewPlayer(agent)} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-4 hover:border-gold/30 hover:bg-white/10 transition-all cursor-pointer group">
                                    <div className="relative">
                                        <img src={agent.avatarUrl} className="w-14 h-14 rounded-full object-cover bg-gray-800 border border-white/10" />
                                        <div className="absolute -bottom-1 -right-1 bg-black text-gold text-[9px] font-bold px-1.5 py-0.5 rounded border border-gold/30">{agent.position || '?'}</div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-bold text-sm truncate group-hover:text-gold transition-colors">{agent.name}</h4>
                                        <div className="flex gap-2 mt-1">
                                            {agent.stats?.rating ? <span className="text-[10px] bg-white/10 text-white px-1.5 rounded font-mono">OVR {agent.stats.rating}</span> : <span className="text-[10px] text-gray-500">Sem Rank</span>}
                                            <span className="text-[10px] text-gray-400">{agent.location || 'Brasil'}</span>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleInvitePlayer(agent); }} disabled={requestedItems.has(agent.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${requestedItems.has(agent.id) ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gold text-black hover:bg-white shadow-lg'}`}>
                                        {requestedItems.has(agent.id) ? 'Enviado' : 'Convocar'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <h3 className="text-white font-bold uppercase tracking-widest text-xs ml-2 mb-2 flex items-center gap-2"><span className="w-2 h-2 bg-neon rounded-full animate-pulse"></span> Clubes ({filteredTeams.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTeams.map((team, idx) => (
                            <div key={team.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-neon/30 hover:bg-white/10 transition-all group shadow-lg backdrop-blur-md">
                                <div onClick={() => setViewingTeamRoster(team)} className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-gray-700 to-black relative flex-shrink-0 shadow-lg cursor-pointer">
                                    <img src={team.logoUrl} className="w-full h-full rounded-full object-cover border border-white/10" />
                                </div>
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewingTeamRoster(team)}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-white text-lg truncate group-hover:text-neon transition-colors">{team.name}</h3>
                                        <span className="bg-green-900/60 text-green-400 border border-green-500/30 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">{team.homeTurf || 'Centro'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-1 mb-2">
                                        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">Liga {team.category}</span>
                                        <span className="text-[10px] text-gray-500 font-bold ml-1">{team.players.length} Jogadores</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                     {currentUser.teamId === team.id ? (
                                         <span className="text-[10px] font-bold text-neon bg-neon/10 px-2 py-1 rounded-full border border-neon/20 whitespace-nowrap">SEU TIME</span>
                                     ) : (
                                         <button onClick={() => handleRequestTrial(team)} disabled={requestedItems.has(team.id)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg border ${requestedItems.has(team.id) ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed' : 'bg-white text-black border-transparent hover:bg-neon hover:text-black hover:scale-110'}`} title="Pedir Teste">
                                             {requestedItems.has(team.id) ? '✓' : '+'}
                                         </button>
                                     )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {viewingTeamRoster && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-pitch-950 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
                            <h3 className="text-white font-bold uppercase tracking-wide">{viewingTeamRoster.name}</h3>
                            <button onClick={() => setViewingTeamRoster(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {viewingTeamRoster.players.length === 0 ? <p className="text-gray-500 text-center py-8 italic">Vazio.</p> : viewingTeamRoster.players.map(player => (
                                <div key={player.id} onClick={() => onViewPlayer && onViewPlayer(player)} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                                    <img src={player.avatarUrl} className="w-10 h-10 rounded-full object-cover bg-gray-800" />
                                    <div className="flex-1"><p className="text-white font-bold text-sm">{player.name}</p><p className="text-[10px] text-gray-400 uppercase font-mono">{player.position}</p></div>
                                </div>
                            ))}
                        </div>
                        {!currentUser.teamId && currentUser.id !== viewingTeamRoster.ownerId && (
                            <div className="p-4 border-t border-white/10 bg-black/20">
                                <button onClick={() => { handleRequestTrial(viewingTeamRoster); setViewingTeamRoster(null); }} className="w-full bg-neon text-black font-bold py-3 rounded-xl uppercase text-xs tracking-widest hover:bg-white transition-colors">Pedir para Jogar Aqui</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};