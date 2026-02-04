import React, { useState } from 'react';
import { Team, UserRole, User } from '../types';
import { dbService } from '../services/database';

interface TeamManagementProps {
  team: Team;
  currentUserRole: UserRole;
}

// Helper for position labels
const POSITION_LABELS: Record<string, string> = {
    'GK': 'Goleiro',
    'DEF': 'Defensor',
    'MID': 'Meio',
    'FWD': 'Atacante'
};

// Helper for field placement (Society 7-a-side approximation)
const POSITION_COORDS: Record<string, { top: string, left: string }[]> = {
    'GK': [{ top: '85%', left: '50%' }],
    'DEF': [{ top: '65%', left: '30%' }, { top: '65%', left: '70%' }],
    'MID': [{ top: '45%', left: '50%' }, { top: '45%', left: '20%' }, { top: '45%', left: '80%' }],
    'FWD': [{ top: '20%', left: '50%' }]
};

export const TeamManagement: React.FC<TeamManagementProps> = ({ team, currentUserRole }) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'lineup'>('roster');
  const maxPlayers = 22;
  const isOwner = currentUserRole === UserRole.OWNER;
  
  // Local state to handle UI updates immediately
  const [localTeam, setLocalTeam] = useState<Team>(team);

  // --- EDIT TEAM INFO STATE ---
  const [isEditingName, setIsEditingName] = useState(false);
  const [teamName, setTeamName] = useState(team.name);
  
  // --- EDIT LOGO STATE ---
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState(team.logoUrl);

  // --- EDIT PLAYER STATE ---
  const [editingPlayer, setEditingPlayer] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{
      bio: string, 
      position: 'GK' | 'DEF' | 'MID' | 'FWD', 
      isStarter: boolean,
      shirtNumber: string
  }>({ bio: '', position: 'MID', isStarter: false, shirtNumber: '' });

  // --- INVITE PLAYER STATE ---
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<{type: 'success' | 'error' | 'loading' | null, msg: string}>({ type: null, msg: '' });

  // --- HANDLERS ---

  const handleSaveLogo = () => {
      if (!logoUrlInput.trim()) return;
      setLocalTeam(prev => ({ ...prev, logoUrl: logoUrlInput }));
      setIsEditingLogo(false);
      // In a real app, call dbService.updateTeam(...) here
  };

  const handleSaveName = () => {
    setLocalTeam(prev => ({ ...prev, name: teamName }));
    setIsEditingName(false);
    // In a real app, call dbService.updateTeam(...) here
  };

  const openPlayerEdit = (player: User) => {
      if (!isOwner) return;
      setEditingPlayer(player);
      setEditForm({
          bio: player.bio || '',
          position: player.position || 'MID',
          isStarter: player.isStarter || false,
          shirtNumber: player.shirtNumber?.toString() || ''
      });
  };

  const savePlayerEdit = () => {
      if (!editingPlayer) return;

      const updatedPlayers = localTeam.players.map(p => {
          if (p.id === editingPlayer.id) {
              return {
                  ...p,
                  bio: editForm.bio,
                  position: editForm.position,
                  isStarter: editForm.isStarter,
                  shirtNumber: parseInt(editForm.shirtNumber) || undefined
              };
          }
          return p;
      });

      setLocalTeam(prev => ({ ...prev, players: updatedPlayers }));
      setEditingPlayer(null);
  };

  const handleInvite = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail) return;

      setInviteStatus({ type: 'loading', msg: 'Buscando jogador...' });

      try {
          const result = await dbService.addPlayerByEmail(inviteEmail, localTeam.id);
          
          if (result.success && result.user) {
              setInviteStatus({ type: 'success', msg: result.message });
              // Update local state instantly
              setLocalTeam(prev => ({
                  ...prev,
                  players: [...prev.players, result.user!]
              }));
              setTimeout(() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteStatus({ type: null, msg: '' });
              }, 1500);
          } else {
              setInviteStatus({ type: 'error', msg: result.message });
          }
      } catch (error) {
          setInviteStatus({ type: 'error', msg: 'Erro ao processar convite.' });
      }
  };

  const handleCopyLink = () => {
      const fakeLink = `https://fut-domination.com/join/${localTeam.id}`;
      navigator.clipboard.writeText(fakeLink);
      setInviteStatus({ type: 'success', msg: 'Link copiado! Envie para seus amigos.' });
  };

  // Lineup Logic
  const starters = localTeam.players.filter(p => p.isStarter);
  const currentPlayers = localTeam.players.length;
  
  // Simple auto-assigner for visualization if coords run out
  const getPlayerPositionStyle = (player: User, index: number) => {
     if (player.position && POSITION_COORDS[player.position]) {
         // Try to find a slot based on how many of this role we have
         const roleIndex = starters.filter((p, i) => i < index && p.position === player.position).length;
         const coords = POSITION_COORDS[player.position][roleIndex % POSITION_COORDS[player.position].length];
         return coords || { top: '50%', left: '50%' };
     }
     return { top: '50%', left: '50%' };
  };

  return (
    <div className="space-y-8 pb-24">
      
      {/* --- HERO SECTION --- */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-pitch-950 border border-white/10 shadow-2xl group">
         <div className="absolute inset-0 bg-carbon opacity-40 mix-blend-overlay"></div>
         <div className="absolute inset-0 bg-gradient-to-br from-pitch-900 via-black to-black opacity-90"></div>
         
         <div className="relative z-10 p-8 flex flex-col items-center text-center">
            
            {/* Logo Logic (URL Input) */}
            <div className="relative group/logo mb-6">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-neon via-white to-black shadow-neon relative">
                    <div className="absolute inset-0 bg-neon rounded-full blur-md opacity-50"></div>
                    <img src={localTeam.logoUrl} alt={team.name} className="relative w-full h-full rounded-full object-cover border-4 border-black bg-black" />
                    
                    {isOwner && !isEditingLogo && (
                        <button 
                            onClick={() => setIsEditingLogo(true)}
                            className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer"
                        >
                            <span className="text-2xl">🔗</span>
                        </button>
                    )}
                </div>

                {isEditingLogo && (
                    <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-64 bg-black border border-white/20 p-2 rounded-xl z-50 flex gap-2 animate-scaleIn">
                        <input 
                            type="text" 
                            value={logoUrlInput}
                            onChange={(e) => setLogoUrlInput(e.target.value)}
                            className="w-full bg-pitch-900 text-xs text-white p-2 rounded border border-pitch-700 focus:border-neon focus:outline-none"
                            placeholder="https://..."
                            autoFocus
                        />
                        <button onClick={handleSaveLogo} className="bg-neon text-black text-xs font-bold px-2 rounded hover:bg-white">OK</button>
                        <button onClick={() => setIsEditingLogo(false)} className="bg-red-500 text-white text-xs font-bold px-2 rounded">X</button>
                    </div>
                )}
            </div>
            
            {/* Editable Name */}
            <div className="mb-2 w-full flex justify-center items-center gap-2">
                {isEditingName ? (
                    <div className="flex gap-2 animate-[fadeIn_0.2s]">
                        <input 
                            type="text" 
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="bg-white/10 border border-neon/50 rounded-lg px-4 py-2 text-3xl font-display font-bold text-white uppercase text-center focus:outline-none focus:ring-2 focus:ring-neon w-full max-w-xs"
                            autoFocus
                        />
                        <button onClick={handleSaveName} className="bg-neon text-black rounded-lg p-2 hover:scale-105 transition-transform">✓</button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 group/name">
                        <h2 className="text-5xl font-display font-bold text-white uppercase italic tracking-wide text-glow">
                            {localTeam.name}
                        </h2>
                        {isOwner && (
                            <button 
                                onClick={() => setIsEditingName(true)} 
                                className="opacity-0 group-hover/name:opacity-100 transition-opacity bg-white/10 p-2 rounded-full hover:bg-white/20"
                            >
                                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Sub-info */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
               <span className="bg-white/5 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold text-neon border border-neon/30 uppercase tracking-widest">Liga {team.category}</span>
               <span className="bg-white/5 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold text-blue-400 border border-blue-500/30 uppercase tracking-widest">
                 📍 Base {team.homeTurf || 'Centro'}
               </span>
            </div>
         </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
        <button
            onClick={() => setActiveTab('roster')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'roster' ? 'bg-pitch-900 text-neon shadow-lg border border-neon/20' : 'text-gray-400 hover:text-white'}`}
        >
            ELENCO
        </button>
        <button
            onClick={() => setActiveTab('lineup')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'lineup' ? 'bg-pitch-900 text-blue-400 shadow-lg border border-blue-500/20' : 'text-gray-400 hover:text-white'}`}
        >
            ESCALAÇÃO (TITULARES)
        </button>
      </div>

      {/* --- ROSTER VIEW --- */}
      {activeTab === 'roster' && (
          <div className="animate-[fadeIn_0.3s]">
             <div className="flex justify-between items-end mb-4 px-2">
                <div>
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-wide">Jogadores Registrados</h3>
                    <p className="text-xs text-gray-500">{currentPlayers}/{maxPlayers} atletas</p>
                </div>
                {isOwner && (
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="text-pitch-950 text-xs font-bold bg-neon px-4 py-2 rounded-lg hover:bg-white transition-colors flex items-center gap-2"
                    >
                        <span>+</span> CONVIDAR
                    </button>
                )}
             </div>
             
             <div className="grid gap-3">
                 {localTeam.players.map((player) => (
                     <div key={player.id} onClick={() => openPlayerEdit(player)} className={`flex items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl relative overflow-hidden group transition-all hover:bg-white/10 ${isOwner ? 'cursor-pointer' : ''}`}>
                         {/* Number */}
                         <div className="font-display text-2xl font-bold text-white/20 w-8 text-center">{player.shirtNumber || '-'}</div>

                         {/* Avatar */}
                         <div className="relative">
                            <img src={player.avatarUrl} className="w-12 h-12 rounded-xl bg-gray-800 object-cover border border-white/10" />
                            {player.isStarter && <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon rounded-full border border-black shadow-[0_0_5px_#39ff14]"></div>}
                         </div>
                         
                         {/* Info */}
                         <div className="flex-1">
                             <h4 className="text-white font-bold tracking-wide flex items-center gap-2">
                                 {player.name}
                                 {player.role === UserRole.OWNER && <span className="text-[8px] bg-gold text-black px-1 rounded uppercase">CPT</span>}
                             </h4>
                             <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold ${player.position === 'GK' ? 'bg-yellow-600 text-black' : player.position === 'FWD' ? 'bg-red-900/50 text-red-200' : 'bg-blue-900/50 text-blue-200'}`}>
                                    {POSITION_LABELS[player.position || 'MID']}
                                </span>
                                {player.bio && <p className="text-[10px] text-gray-400 truncate max-w-[150px] italic">"{player.bio}"</p>}
                             </div>
                         </div>
                         
                         {/* Edit Icon (Owner Only) */}
                         {isOwner && (
                             <div className="pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <span className="text-xs text-neon font-bold uppercase">Editar</span>
                             </div>
                         )}
                     </div>
                 ))}

                 {/* EMPTY SLOT / INVITE BUTTONS */}
                 {isOwner && currentPlayers < maxPlayers && (
                     <>
                        <button 
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-4 bg-black/20 border border-dashed border-white/10 p-3 rounded-2xl group hover:border-neon/50 hover:bg-neon/5 transition-all"
                        >
                            <div className="w-8 text-center"></div>
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-neon group-hover:text-neon text-gray-500 transition-colors">
                                <span className="text-2xl font-bold">+</span>
                            </div>
                            <div className="flex-1 text-left">
                                <h4 className="text-gray-500 font-bold group-hover:text-neon transition-colors">Vaga Aberta</h4>
                                <p className="text-[10px] text-gray-600">Toque para convidar</p>
                            </div>
                        </button>
                         <button 
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-4 bg-black/20 border border-dashed border-white/10 p-3 rounded-2xl group hover:border-neon/50 hover:bg-neon/5 transition-all"
                        >
                            <div className="w-8 text-center"></div>
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-neon group-hover:text-neon text-gray-500 transition-colors">
                                <span className="text-2xl font-bold">+</span>
                            </div>
                            <div className="flex-1 text-left">
                                <h4 className="text-gray-500 font-bold group-hover:text-neon transition-colors">Vaga Aberta</h4>
                                <p className="text-[10px] text-gray-600">Toque para convidar</p>
                            </div>
                        </button>
                     </>
                 )}
             </div>
          </div>
      )}

      {/* --- LINEUP VIEW (FIELD) --- */}
      {activeTab === 'lineup' && (
          <div className="animate-[fadeIn_0.3s]">
              <div className="relative aspect-[3/4] md:aspect-video w-full bg-[#1a472a] rounded-[2rem] border-4 border-pitch-900 shadow-2xl overflow-hidden mb-4">
                  {/* Field Markings */}
                  <div className="absolute inset-4 border-2 border-white/20 rounded-xl"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/20"></div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-b-2 border-x-2 border-white/20 rounded-b-xl"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-t-2 border-x-2 border-white/20 rounded-t-xl"></div>
                  
                  {/* Grass Pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>

                  {/* Players on Field */}
                  {starters.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                          <p className="bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur">Nenhum titular definido</p>
                      </div>
                  ) : (
                      starters.map((player, idx) => {
                          const style = getPlayerPositionStyle(player, idx);
                          return (
                              <div 
                                key={player.id} 
                                className="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110 cursor-pointer z-10"
                                style={style}
                                onClick={() => openPlayerEdit(player)}
                              >
                                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-white shadow-lg bg-gray-800 overflow-hidden relative">
                                      <img src={player.avatarUrl} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="mt-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold text-white text-center min-w-[60px] border border-white/10">
                                      {player.name}
                                  </div>
                                  <div className="mt-0.5 text-[8px] font-bold text-neon uppercase bg-black px-1 rounded">
                                      {player.shirtNumber || '-'}
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>
              <p className="text-center text-xs text-gray-500">Toque em um jogador na lista para defini-lo como titular.</p>
          </div>
      )}

      {/* --- INVITE MODAL --- */}
      {showInviteModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
              <div className="bg-pitch-900 border border-neon/30 rounded-2xl w-full max-w-sm p-6 shadow-[0_0_50px_rgba(57,255,20,0.1)] animate-scaleIn">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-white uppercase">Recrutar Jogador</h3>
                      <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-white">✕</button>
                  </div>
                  
                  <div className="space-y-6">
                      {/* Share Code Section */}
                      <div className="bg-white/5 p-4 rounded-xl border border-dashed border-white/10 text-center">
                          <p className="text-xs text-gray-400 mb-2 font-bold uppercase">Código do Time</p>
                          <div className="flex items-center gap-2 justify-center mb-2">
                             <code className="bg-black px-3 py-1 rounded text-neon font-mono text-lg">{localTeam.id.slice(0,8).toUpperCase()}</code>
                          </div>
                          <button onClick={handleCopyLink} className="text-neon text-xs font-bold hover:underline">Copiar Link de Convite</button>
                      </div>

                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <div className="h-px bg-gray-700 flex-1"></div>
                          <span>OU</span>
                          <div className="h-px bg-gray-700 flex-1"></div>
                      </div>

                      {/* Direct Add Form */}
                      <form onSubmit={handleInvite}>
                          <label className="block text-xs font-bold text-pitch-300 uppercase mb-1">E-mail do Jogador (Cadastrado)</label>
                          <div className="flex gap-2">
                            <input 
                                type="email" 
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                className="flex-1 bg-black/50 border border-pitch-700 rounded-lg p-3 text-white focus:border-neon focus:outline-none placeholder-gray-600"
                                placeholder="jogador@email.com"
                                required
                            />
                            <button 
                                type="submit" 
                                disabled={inviteStatus.type === 'loading'}
                                className="bg-neon text-black font-bold px-4 rounded-lg hover:bg-white transition-colors"
                            >
                                {inviteStatus.type === 'loading' ? '...' : 'Add'}
                            </button>
                          </div>
                      </form>

                      {/* Status Message */}
                      {inviteStatus.msg && (
                          <div className={`text-sm font-bold text-center p-2 rounded border ${
                              inviteStatus.type === 'success' ? 'bg-green-900/20 text-green-400 border-green-500/20' : 
                              inviteStatus.type === 'error' ? 'bg-red-900/20 text-red-400 border-red-500/20' : 'text-gray-400 border-transparent'
                          }`}>
                              {inviteStatus.msg}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- EDIT PLAYER MODAL --- */}
      {editingPlayer && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
              <div className="bg-pitch-950 border border-neon/30 rounded-2xl w-full max-w-sm p-6 shadow-[0_0_50px_rgba(57,255,20,0.1)] animate-scaleIn relative overflow-hidden">
                  {/* Neon decorative line */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon to-transparent"></div>
                  
                  <div className="flex items-center gap-4 mb-6">
                      <img src={editingPlayer.avatarUrl} className="w-16 h-16 rounded-xl object-cover border border-white/20" />
                      <div>
                          <h3 className="text-xl font-display font-bold text-white uppercase">{editingPlayer.name}</h3>
                          <p className="text-xs text-gray-400">Editar Atleta</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                      {/* Shirt Number */}
                      <div>
                          <label className="block text-xs font-bold text-pitch-300 uppercase mb-1">Número da Camisa</label>
                          <input 
                              type="number" 
                              value={editForm.shirtNumber}
                              onChange={e => setEditForm({...editForm, shirtNumber: e.target.value})}
                              className="w-full bg-black/50 border border-pitch-700 rounded-lg p-3 text-white focus:border-neon focus:outline-none font-mono"
                              placeholder="10"
                          />
                      </div>

                      {/* Position */}
                      <div>
                          <label className="block text-xs font-bold text-pitch-300 uppercase mb-1">Posição Tática</label>
                          <div className="grid grid-cols-4 gap-2">
                              {Object.entries(POSITION_LABELS).map(([key, label]) => (
                                  <button
                                    key={key}
                                    onClick={() => setEditForm({...editForm, position: key as any})}
                                    className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${editForm.position === key ? 'bg-neon text-black border-neon' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'}`}
                                  >
                                      {label}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Bio */}
                      <div>
                          <label className="block text-xs font-bold text-pitch-300 uppercase mb-1">Bio do Jogador</label>
                          <textarea 
                              value={editForm.bio}
                              onChange={e => setEditForm({...editForm, bio: e.target.value})}
                              className="w-full bg-black/50 border border-pitch-700 rounded-lg p-3 text-white focus:border-neon focus:outline-none text-sm resize-none h-20"
                              placeholder="Ex: Especialista em cobranças de falta..."
                          />
                      </div>

                      {/* Starter Switch */}
                      <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-sm font-bold text-white">Escalado como Titular?</span>
                          <div 
                            onClick={() => setEditForm({...editForm, isStarter: !editForm.isStarter})}
                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${editForm.isStarter ? 'bg-neon' : 'bg-gray-700'}`}
                          >
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${editForm.isStarter ? 'translate-x-6' : ''}`}></div>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                          <button onClick={() => setEditingPlayer(null)} className="py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5">Cancelar</button>
                          <button onClick={savePlayerEdit} className="py-3 rounded-xl font-bold bg-white text-black hover:bg-gray-200">Salvar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};