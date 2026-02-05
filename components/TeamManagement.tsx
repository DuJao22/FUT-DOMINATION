import React, { useState, useEffect } from 'react';
import { Team, User, UserRole, Post } from '../types';
import { dbService } from '../services/database';

interface TeamManagementProps {
  team: Team;
  currentUser: User; // We need the whole user object now for following logic
  onViewPlayer?: (user: User) => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ team, currentUser, onViewPlayer }) => {
  const [localTeam, setLocalTeam] = useState<Team>(team);
  const [activeTab, setActiveTab] = useState<'posts' | 'squad' | 'schedule'>('squad');
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
      name: team.name,
      bio: team.bio || '',
      logoUrl: team.logoUrl
  });
  const [isSaving, setIsSaving] = useState(false);

  // Post Creation State
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postType, setPostType] = useState<'match' | 'news'>('news');
  const [postForm, setPostForm] = useState({
      content: '',
      opponent: '',
      myScore: '',
      oppScore: '',
      location: ''
  });

  // Follow State
  const [isFollowing, setIsFollowing] = useState(currentUser.following.includes(team.id));

  const isOwner = currentUser.role === UserRole.OWNER && currentUser.teamId === team.id;

  useEffect(() => {
      setLocalTeam(team);
      setEditForm({ name: team.name, bio: team.bio || '', logoUrl: team.logoUrl });
      setIsFollowing(currentUser.following.includes(team.id));
  }, [team, currentUser]);

  // --- HANDLERS ---

  const handleSaveProfile = async () => {
      setIsSaving(true);
      try {
          await dbService.updateTeamInfo(localTeam.id, editForm.name, editForm.logoUrl, editForm.bio);
          setLocalTeam(prev => ({ ...prev, name: editForm.name, logoUrl: editForm.logoUrl, bio: editForm.bio }));
          setIsEditing(false);
          alert("Perfil atualizado com sucesso!");
      } catch (e) {
          alert("Erro ao salvar perfil.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleToggleFollow = async () => {
      if (isFollowing) {
          const success = await dbService.unfollowTeam(currentUser.id, team.id);
          if (success) setIsFollowing(false);
      } else {
          const success = await dbService.followTeam(currentUser.id, team.id);
          if (success) setIsFollowing(true);
      }
  };

  const handleCreatePost = async () => {
      if (!postForm.content) return;
      setIsSaving(true);

      const newPost: Post = {
          id: `p-${Date.now()}`,
          authorId: currentUser.id,
          authorName: localTeam.name,
          authorRole: UserRole.OWNER,
          content: postForm.content,
          likes: 0,
          timestamp: new Date(),
          teamId: localTeam.id,
          comments: [],
          matchContext: postType === 'match' ? {
              opponentName: postForm.opponent,
              result: `${postForm.myScore} - ${postForm.oppScore}`,
              location: postForm.location
          } : undefined
      };

      const success = await dbService.createPost(newPost);
      if (success) {
          alert("Post publicado no feed!");
          setIsCreatingPost(false);
          setPostForm({ content: '', opponent: '', myScore: '', oppScore: '', location: '' });
      } else {
          alert("Erro ao publicar.");
      }
      setIsSaving(false);
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

  return (
    <div className="pb-24 max-w-4xl mx-auto">
      
      {/* --- INSTAGRAM HEADER --- */}
      <div className="bg-black/40 backdrop-blur-md rounded-b-3xl border-b border-white/5 p-6 mb-6">
          <div className="flex items-center gap-6">
              
              {/* Profile Pic */}
              <div className="relative">
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-neon via-white to-black">
                      <img src={localTeam.logoUrl} className="w-full h-full rounded-full object-cover border-2 border-black" />
                  </div>
                  {/* Category Badge */}
                  <div className="absolute -bottom-2 -right-2 bg-pitch-900 border border-white/10 px-2 py-0.5 rounded-lg text-[10px] font-bold text-gray-300 uppercase">
                      {localTeam.category}
                  </div>
              </div>

              {/* Stats & Actions */}
              <div className="flex-1">
                  <div className="flex justify-around text-center mb-4">
                      <div>
                          <span className="block font-bold text-white text-lg">---</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Posts</span>
                      </div>
                      <div>
                          <span className="block font-bold text-white text-lg">{localTeam.wins}</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Vitórias</span>
                      </div>
                      <div>
                          <span className="block font-bold text-white text-lg">{localTeam.players.length}</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Elenco</span>
                      </div>
                  </div>

                  {isOwner ? (
                      <div className="flex gap-2">
                          <button onClick={() => setIsEditing(true)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2 rounded-lg transition-colors">
                              Editar Perfil
                          </button>
                          <button onClick={() => setIsCreatingPost(true)} className="flex-1 bg-neon text-black font-bold text-xs py-2 rounded-lg transition-colors shadow-neon/20">
                              + Publicar
                          </button>
                      </div>
                  ) : (
                      <button 
                        onClick={handleToggleFollow}
                        className={`w-full font-bold text-xs py-2 rounded-lg transition-all ${isFollowing ? 'bg-white/10 text-white border border-white/20' : 'bg-blue-600 text-white shadow-lg'}`}
                      >
                          {isFollowing ? 'Seguindo' : 'Seguir'}
                      </button>
                  )}
              </div>
          </div>

          {/* Bio Section */}
          <div className="mt-4">
              <h1 className="text-white font-display font-bold text-xl tracking-wide">{localTeam.name}</h1>
              <p className="text-gray-400 text-sm mt-1 whitespace-pre-wrap leading-relaxed">{localTeam.bio || "Sem biografia..."}</p>
              <p className="text-neon text-xs mt-2 font-bold uppercase tracking-widest flex items-center gap-1">
                  📍 {localTeam.homeTurf || "Sem Base"}
              </p>
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

      {/* --- CREATE POST MODAL (OWNER) --- */}
      {isCreatingPost && (
          <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4">
              <div className="bg-pitch-950 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-[slideUp_0.2s]">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white">Novo Post</h3>
                      <div className="flex bg-black rounded-lg p-1 border border-white/10">
                          <button onClick={() => setPostType('news')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${postType === 'news' ? 'bg-white text-black' : 'text-gray-500'}`}>Aviso</button>
                          <button onClick={() => setPostType('match')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${postType === 'match' ? 'bg-neon text-black' : 'text-gray-500'}`}>Placar</button>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <textarea 
                          value={postForm.content}
                          onChange={e => setPostForm({...postForm, content: e.target.value})}
                          className="w-full bg-black border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none h-24 resize-none"
                          placeholder={postType === 'match' ? "Comentário sobre o jogo..." : "O que está acontecendo no clube?"}
                      />

                      {postType === 'match' && (
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-3">
                              <input 
                                  type="text"
                                  placeholder="Nome do Adversário"
                                  className="w-full bg-black border border-white/10 rounded-lg p-2 text-white text-xs"
                                  value={postForm.opponent}
                                  onChange={e => setPostForm({...postForm, opponent: e.target.value})}
                              />
                              <div className="flex items-center gap-2">
                                  <input type="number" placeholder="Nós" className="w-12 bg-black border border-white/10 rounded-lg p-2 text-center text-white font-bold" value={postForm.myScore} onChange={e => setPostForm({...postForm, myScore: e.target.value})}/>
                                  <span className="text-gray-500">-</span>
                                  <input type="number" placeholder="Eles" className="w-12 bg-black border border-white/10 rounded-lg p-2 text-center text-white font-bold" value={postForm.oppScore} onChange={e => setPostForm({...postForm, oppScore: e.target.value})}/>
                              </div>
                              <input 
                                  type="text"
                                  placeholder="Local do Jogo (Opcional)"
                                  className="w-full bg-black border border-white/10 rounded-lg p-2 text-white text-xs"
                                  value={postForm.location}
                                  onChange={e => setPostForm({...postForm, location: e.target.value})}
                              />
                          </div>
                      )}

                      <div className="flex gap-2 pt-2">
                          <button onClick={() => setIsCreatingPost(false)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl">Cancelar</button>
                          <button onClick={handleCreatePost} disabled={isSaving || !postForm.content} className="flex-1 bg-neon text-black font-bold py-3 rounded-xl">
                              Publicar
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
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest ${activeTab === 'posts' ? 'text-white border-b-2 border-white' : 'text-gray-500'}`}
          >
              📰 Posts
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
                              + Adicionar Jogador
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
                                      <button onClick={(e) => handlePromotePlayer(e, player.id)} className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center hover:bg-gold hover:text-black">👑</button>
                                      <button onClick={(e) => handleRemovePlayer(e, player.id)} className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white">✕</button>
                                  </div>
                              )}
                          </div>
                      ))}
                      {localTeam.players.length === 0 && <p className="col-span-full text-center text-gray-500 py-8 italic">Nenhum jogador no elenco.</p>}
                  </div>
              </div>
          )}

          {/* POSTS TAB (Placeholder Grid) */}
          {activeTab === 'posts' && (
              <div className="grid grid-cols-3 gap-1 animate-fadeIn">
                  {/* Since we don't have posts linked fully yet in this view, showing placeholders or real implementation later. 
                      Ideally this would map over 'posts' from DB related to teamId. For now, showing empty state or static. */}
                  <div className="aspect-square bg-white/5 flex items-center justify-center text-gray-600 border border-white/5">
                      📷
                  </div>
                  <div className="aspect-square bg-white/5 flex items-center justify-center text-gray-600 border border-white/5">
                      📷
                  </div>
                  <div className="aspect-square bg-white/5 flex items-center justify-center text-gray-600 border border-white/5">
                      📷
                  </div>
                  {/* In a real implementation, you'd fetch posts here */}
                  <div className="col-span-3 text-center py-8 text-gray-500 text-xs">
                      Postagens aparecerão aqui no feed do clube.
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
