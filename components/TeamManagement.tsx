import React, { useState } from 'react';
import { Team, User, UserRole } from '../types';
import { dbService } from '../services/database';

interface TeamManagementProps {
  team: Team;
  currentUserRole: UserRole;
  onViewPlayer?: (user: User) => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ team, currentUserRole, onViewPlayer }) => {
  const [localTeam, setLocalTeam] = useState<Team>(team);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  
  const [teamName, setTeamName] = useState(team.name);
  const [logoUrlInput, setLogoUrlInput] = useState(team.logoUrl);

  const isOwner = currentUserRole === UserRole.OWNER;

  // --- HANDLERS ---
  const handleSaveLogo = async () => {
      if (!logoUrlInput.trim()) return;
      
      const newLogo = logoUrlInput;
      setLocalTeam(prev => ({ ...prev, logoUrl: newLogo }));
      setIsEditingLogo(false);

      await dbService.updateTeamInfo(localTeam.id, localTeam.name, newLogo);
  };

  const handleSaveName = async () => {
    if (!teamName.trim()) return;

    const newName = teamName;
    setLocalTeam(prev => ({ ...prev, name: newName }));
    setIsEditingName(false);

    await dbService.updateTeamInfo(localTeam.id, newName, localTeam.logoUrl);
  };

  const handlePromotePlayer = async (e: React.MouseEvent, playerId: string) => {
      e.stopPropagation();
      if (!window.confirm("Promover este jogador a Dono? Ele terá acesso total.")) return;
      
      const res = await dbService.promotePlayerToOwner(playerId, localTeam.id);
      if (res.success) {
          alert(res.message);
          setLocalTeam(prev => ({
              ...prev,
              players: prev.players.map(p => p.id === playerId ? {...p, role: UserRole.OWNER} : p)
          }));
      } else {
          alert(res.message);
      }
  };

  const handleRemovePlayer = async (e: React.MouseEvent, playerId: string) => {
      e.stopPropagation();
      if (!window.confirm("Tem certeza que deseja remover este jogador do time?")) return;

      const res = await dbService.removePlayerFromTeam(playerId);
      if (res.success) {
          setLocalTeam(prev => ({
              ...prev,
              players: prev.players.filter(p => p.id !== playerId)
          }));
      } else {
          alert("Erro ao remover jogador.");
      }
  };

  return (
    <div className="space-y-8 pb-24">
      
      {/* Team Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-pitch-900 border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-pitch-800 to-black"></div>
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon/10 rounded-full blur-[80px]"></div>

          <div className="relative z-10 p-8 flex flex-col md:flex-row items-center gap-8">
              
              {/* Logo Section */}
              <div className="relative group">
                  <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-gray-700 to-black shadow-2xl relative z-10">
                      <img src={localTeam.logoUrl} alt="Team Logo" className="w-full h-full rounded-full object-cover border border-white/10" />
                  </div>
                  {/* Edit Logo Overlay */}
                  {isOwner && (
                    <button 
                        onClick={() => setIsEditingLogo(true)}
                        className="absolute bottom-0 right-0 bg-pitch-950 border border-white/20 p-2 rounded-full text-white hover:text-neon hover:border-neon transition-all z-20 shadow-lg"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  )}
              </div>

              {/* Team Info */}
              <div className="text-center md:text-left flex-1">
                  {isEditingName ? (
                      <div className="flex items-center gap-2 mb-2">
                          <input 
                              type="text" 
                              value={teamName}
                              onChange={(e) => setTeamName(e.target.value)}
                              className="bg-black/50 border border-neon/50 rounded-lg px-3 py-1 text-2xl font-display font-bold text-white focus:outline-none"
                          />
                          <button onClick={handleSaveName} className="text-green-400 hover:text-white bg-green-900/30 p-2 rounded-lg">✓</button>
                          <button onClick={() => setIsEditingName(false)} className="text-red-400 hover:text-white bg-red-900/30 p-2 rounded-lg">✕</button>
                      </div>
                  ) : (
                      <h2 className="text-4xl font-display font-bold text-white uppercase italic tracking-wide mb-2 flex items-center justify-center md:justify-start gap-3 group">
                          {localTeam.name}
                          {isOwner && (
                              <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-neon">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                          )}
                      </h2>
                  )}

                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-bold text-gray-300">
                          {localTeam.category}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-bold text-gray-300 flex items-center gap-1">
                          📍 {localTeam.homeTurf || 'Sem Base'}
                      </span>
                  </div>

                  <div className="flex justify-center md:justify-start gap-8">
                      <div className="text-center">
                          <span className="block text-2xl font-bold text-white">{localTeam.wins}</span>
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Vitórias</span>
                      </div>
                      <div className="text-center">
                          <span className="block text-2xl font-bold text-gray-400">{localTeam.losses}</span>
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Derrotas</span>
                      </div>
                      <div className="text-center">
                          <span className="block text-2xl font-bold text-gray-400">{localTeam.draws}</span>
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Empates</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Edit Logo Modal */}
      {isEditingLogo && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-pitch-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm">
                  <h3 className="text-white font-bold mb-4">Alterar Escudo</h3>
                  <input 
                      type="text" 
                      value={logoUrlInput}
                      onChange={(e) => setLogoUrlInput(e.target.value)}
                      placeholder="URL da Imagem..."
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white mb-4"
                  />
                  <div className="flex gap-2">
                      <button onClick={() => setIsEditingLogo(false)} className="flex-1 py-3 rounded-lg bg-gray-700 text-white font-bold">Cancelar</button>
                      <button onClick={handleSaveLogo} className="flex-1 py-3 rounded-lg bg-neon text-black font-bold">Salvar</button>
                  </div>
              </div>
          </div>
      )}

      {/* Roster Section */}
      <div>
          <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-xl font-display font-bold text-white uppercase italic tracking-wide">Elenco</h3>
              {isOwner && (
                  <button className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
                      + Adicionar Jogador (Via Email)
                  </button>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localTeam.players.map(player => (
                  <div 
                    key={player.id} 
                    onClick={() => onViewPlayer && onViewPlayer(player)} // CLICK HANDLER ADDED
                    className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-neon/30 hover:bg-white/10 transition-all cursor-pointer group relative"
                  >
                      <div className="relative">
                           <img src={player.avatarUrl} className="w-12 h-12 rounded-full object-cover bg-gray-800" />
                           {player.role === UserRole.OWNER && (
                               <div className="absolute -top-1 -right-1 text-xs">👑</div>
                           )}
                      </div>
                      <div className="flex-1">
                          <p className="font-bold text-white text-sm group-hover:text-neon transition-colors">{player.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{player.position} • Camisa {player.shirtNumber || '-'}</p>
                      </div>
                      
                      {/* Admin Actions */}
                      {isOwner && player.role !== UserRole.OWNER && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => handlePromotePlayer(e, player.id)}
                                title="Promover a Dono"
                                className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center hover:bg-gold hover:text-black transition-colors"
                              >
                                  👑
                              </button>
                              <button 
                                onClick={(e) => handleRemovePlayer(e, player.id)}
                                title="Remover do Time"
                                className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                              >
                                  ✕
                              </button>
                          </div>
                      )}
                  </div>
              ))}
              
              {localTeam.players.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500 italic">
                      Nenhum jogador no elenco.
                  </div>
              )}
          </div>
      </div>

    </div>
  );
};