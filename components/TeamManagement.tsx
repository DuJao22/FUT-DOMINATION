import React, { useState, useEffect } from 'react';
import { Team, User, UserRole } from '../types';
import { dbService } from '../services/database';

interface TeamManagementProps {
  team: Team;
  teams: Team[]; 
  currentUser: User; 
  onViewPlayer?: (user: User) => void;
  onRefreshData?: () => void; 
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ team, teams, currentUser, onViewPlayer, onRefreshData }) => {
  const [localTeam, setLocalTeam] = useState<Team>(team);
  const [activeTab, setActiveTab] = useState<'squad' | 'schedule'>('squad');
  
  // Follow State
  const [isFollowing, setIsFollowing] = useState(currentUser.following.includes(team.id));

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
      name: team.name,
      bio: team.bio || '',
      logoUrl: team.logoUrl
  });
  const [isSaving, setIsSaving] = useState(false);

  // ROBUST OWNER CHECK
  const isOwner = currentUser.id === team.ownerId;

  // Check if User is a Fan/Player WITHOUT a team (showing the fallback 'temp_team')
  const hasNoTeam = !isOwner && (team.id === 'temp_team' || !currentUser.teamId);

  // IMPORTANT: Only update local state if NOT editing.
  useEffect(() => {
      if (!isEditing) {
          setLocalTeam(team);
          setEditForm({ name: team.name, bio: team.bio || '', logoUrl: team.logoUrl });
          setIsFollowing(currentUser.following.includes(team.id));
      }
  }, [team, currentUser, isEditing]);

  // --- HANDLERS ---

  const handleSaveProfile = async () => {
      setIsSaving(true);
      try {
          let targetId = localTeam.id;
          
          if (targetId === 'temp_team' || !targetId || targetId.startsWith('temp')) {
              targetId = `t-${Date.now()}`;
              await dbService.executeQuery(`UPDATE users SET team_id = '${targetId}' WHERE id = '${currentUser.id}'`);
          }

          await dbService.saveTeamProfile(targetId, currentUser.id, editForm.name, editForm.logoUrl, editForm.bio);
          
          const updatedTeam = { 
              ...localTeam, 
              id: targetId,
              name: editForm.name, 
              logoUrl: editForm.logoUrl, 
              bio: editForm.bio 
          };
          setLocalTeam(updatedTeam);
          
          if (onRefreshData) {
              onRefreshData();
          }
          
          setIsEditing(false);
          alert("Perfil salvo com sucesso!");
      } catch (e) {
          alert("Erro ao salvar perfil.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleToggleFollow = async () => {
      if (isFollowing) {
          const success = await dbService.unfollowTeam(currentUser.id, team.id);
          if (success) {
              setIsFollowing(false);
          }
      } else {
          const success = await dbService.followTeam(currentUser.id, team.id);
          if (success) {
              setIsFollowing(true);
          }
      }
  };

  const handlePromotePlayer = async (e: React.MouseEvent, playerId: string) => {
      e.stopPropagation();
      if (!isOwner) return;
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
      if (!isOwner) return;
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

  // --- RENDER FOR FANS/PLAYERS WITHOUT TEAM ---
  if (hasNoTeam) {
      return (
          <div className="pb-24 max-w-4xl mx-auto px-4 mt-8">
              <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10 animate-fadeIn">
                  <div className="w-20 h-20 bg-pitch-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <span className="text-4xl opacity-50">💔</span>
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white uppercase italic">Você não tem time</h2>
                  <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                      Como torcedor ou agente livre, você precisa encontrar um clube para seguir ou jogar.
                  </p>
              </div>

              {/* Suggested Teams to Follow */}
              <div className="mt-8">
                  <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-neon rounded-full animate-pulse"></span>
                      Clubes em Destaque
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teams.filter(t => t.id !== 'temp_team').slice(0, 4).map((t) => {
                          const isFollowingT = currentUser.following.includes(t.id);
                          return (
                              <div key={t.id} className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 border border-white/5">
                                  <img src={t.logoUrl} className="w-14 h-14 rounded-full object-cover bg-black" />
                                  <div className="flex-1">
                                      <h4 className="text-white font-bold">{t.name}</h4>
                                      <p className="text-gray-500 text-xs">{t.neighborhood || t.homeTurf || 'Sem local'}</p>
                                  </div>
                                  <button 
                                      onClick={async () => {
                                          if(isFollowingT) {
                                              await dbService.unfollowTeam(currentUser.id, t.id);
                                          } else {
                                              await dbService.followTeam(currentUser.id, t.id);
                                          }
                                          if(onRefreshData) onRefreshData();
                                      }}
                                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${isFollowingT ? 'bg-white/10 text-white' : 'bg-blue-600 text-white'}`}
                                  >
                                      {isFollowingT ? 'Seguindo' : 'Seguir'}
                                  </button>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER FOR TEAM MEMBERS / OWNERS ---
  return (
    <div className="pb-24 max-w-4xl mx-auto">
      
      {/* --- INFO HEADER (Not Instagram Style) --- */}
      <div className="bg-gradient-to-r from-pitch-900 to-black rounded-b-3xl border-b border-white/5 p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              {/* Profile Pic */}
              <div className="relative group">
                  <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-neon via-white to-black shadow-lg">
                      <img src={localTeam.logoUrl} className="w-full h-full rounded-full object-cover border-4 border-pitch-950" />
                  </div>
                  {/* Category Badge */}
                  <div className="absolute -bottom-2 -right-2 bg-pitch-950 border border-white/20 px-3 py-1 rounded-full text-[10px] font-bold text-gray-300 uppercase shadow-lg">
                      {localTeam.category}
                  </div>
              </div>

              {/* Text Info */}
              <div className="flex-1 text-center md:text-left">
                  <h1 className="text-white font-display font-bold text-3xl md:text-4xl tracking-wide uppercase leading-none mb-2">
                      {localTeam.name}
                  </h1>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4 text-sm">
                      <span className="text-gray-400 flex items-center gap-1">
                          📍 {localTeam.homeTurf || "Sem Base"}
                      </span>
                      <span className="text-gray-400 flex items-center gap-1">
                          🏆 {localTeam.wins} Vitórias
                      </span>
                  </div>

                  {localTeam.bio && (
                      <p className="text-gray-500 text-xs max-w-lg leading-relaxed mb-4 mx-auto md:mx-0">
                          {localTeam.bio}
                      </p>
                  )}

                  {/* Actions */}
                  <div className="flex justify-center md:justify-start gap-3">
                      {isOwner ? (
                          <button onClick={() => setIsEditing(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-6 py-2 rounded-lg transition-colors border border-white/10">
                              Editar Clube
                          </button>
                      ) : (
                          <button 
                            onClick={handleToggleFollow}
                            className={`font-bold text-xs px-6 py-2 rounded-lg transition-all ${isFollowing ? 'bg-white/10 text-white border border-white/20' : 'bg-neon text-black shadow-lg'}`}
                          >
                              {isFollowing ? 'Seguindo' : 'Seguir Clube'}
                          </button>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* --- EDIT MODAL (OWNER) --- */}
      {isEditing && (
          <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4">
              <div className="bg-pitch-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-[slideUp_0.2s]">
                  <h3 className="text-xl font-bold text-white mb-4">Editar Perfil</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Nome do Time</label>
                          <input 
                              type="text" 
                              value={editForm.name} 
                              onChange={e => setEditForm({...editForm, name: e.target.value})}
                              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-neon focus:outline-none"
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Logo URL</label>
                          <input 
                              type="text" 
                              value={editForm.logoUrl} 
                              onChange={e => setEditForm({...editForm, logoUrl: e.target.value})}
                              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-neon focus:outline-none text-xs"
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Biografia</label>
                          <textarea 
                              value={editForm.bio} 
                              onChange={e => setEditForm({...editForm, bio: e.target.value})}
                              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-neon focus:outline-none resize-none h-24"
                              placeholder="Conte a história do time..."
                          />
                      </div>
                      <div className="flex gap-2 pt-2">
                          <button onClick={() => setIsEditing(false)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl">Cancelar</button>
                          <button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 bg-neon text-black font-bold py-3 rounded-xl">
                              {isSaving ? '...' : 'Salvar'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- TABS --- */}
      <div className="flex border-t border-b border-white/10 mb-4 sticky top-0 bg-pitch-950/80 backdrop-blur z-10">
          <button 
            onClick={() => setActiveTab('squad')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest ${activeTab === 'squad' ? 'text-white border-b-2 border-white' : 'text-gray-500'}`}
          >
              👥 Elenco
          </button>
          <button 
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest ${activeTab === 'schedule' ? 'text-white border-b-2 border-white' : 'text-gray-500'}`}
          >
              📅 Jogos
          </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="px-2">
          
          {/* SQUAD TAB */}
          {activeTab === 'squad' && (
              <div className="space-y-4 animate-fadeIn">
                  {isOwner && (
                      <div className="flex justify-end px-2">
                          <button className="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
                              + Gerenciar Jogadores
                          </button>
                      </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {localTeam.players.map(player => (
                          <div 
                            key={player.id} 
                            onClick={() => onViewPlayer && onViewPlayer(player)}
                            className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-4 hover:bg-white/10 cursor-pointer transition-all"
                          >
                              <div className="relative">
                                   <img src={player.avatarUrl} className="w-12 h-12 rounded-full object-cover bg-gray-800" />
                                   {player.role === UserRole.OWNER && (
                                       <div className="absolute -top-1 -right-1 text-xs">👑</div>
                                   )}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="font-bold text-white text-sm truncate">{player.name}</p>
                                  <p className="text-[10px] text-gray-500 font-mono uppercase">{player.position || 'Jogador'} • #{player.shirtNumber || '-'}</p>
                              </div>
                              {/* Admin Actions */}
                              {isOwner && player.role !== UserRole.OWNER && (
                                  <div className="flex gap-2">
                                      <button onClick={(e) => handlePromotePlayer(e, player.id)} className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center hover:bg-gold hover:text-black" title="Promover a Dono">👑</button>
                                      <button onClick={(e) => handleRemovePlayer(e, player.id)} className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white" title="Remover do Time">✕</button>
                                  </div>
                              )}
                          </div>
                      ))}
                      {localTeam.players.length === 0 && <p className="col-span-full text-center text-gray-500 py-8 italic">Nenhum jogador no elenco.</p>}
                  </div>
              </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10 animate-fadeIn">
                  <span className="text-3xl block mb-2 opacity-30">📅</span>
                  <p className="text-gray-400 text-sm">Nenhum jogo agendado.</p>
                  {isOwner && <p className="text-xs text-neon mt-2 cursor-pointer hover:underline">Ir para Calendário</p>}
              </div>
          )}

      </div>
    </div>
  );
};