import React, { useState, useEffect, useRef } from 'react';
import { Navigation } from './components/Navigation';
import { TerritoryMap } from './components/TerritoryMap';
import { Feed } from './components/Feed';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { TeamManagement } from './components/TeamManagement';
import { MatchLogger } from './components/MatchLogger';
import { MatchCalendar } from './components/MatchCalendar';
import { PickupSoccer } from './components/PickupSoccer'; 
import { Profile } from './components/Profile';
import { Rankings } from './components/Rankings';
import { TransferMarket } from './components/TransferMarket';
import { NotificationsModal } from './components/NotificationsModal';
import { TutorialOverlay, TutorialStep } from './components/TutorialOverlay';
import { LandingPage } from './components/LandingPage'; 
import { MOCK_POSTS } from './constants'; 
import { UserRole, User, Team, Match, Territory, Court, PickupGame } from './types';
import { dbService } from './services/database';

const App: React.FC = () => {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState(true); 
  const [currentTab, setCurrentTab] = useState('map');
  const [showMatchLogger, setShowMatchLogger] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  
  // --- PLAYER VIEW STATE ---
  const [viewingPlayer, setViewingPlayer] = useState<User | null>(null);
  const [playerLiked, setPlayerLiked] = useState(false); 
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // --- TUTORIAL STATE ---
  const [showTutorial, setShowTutorial] = useState(false);

  // --- APP STATE (FROM DB) ---
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [pickupGames, setPickupGames] = useState<PickupGame[]>([]);

  // Polling Interval Ref
  const intervalRef = useRef<number | null>(null);

  // --- INITIALIZATION & SESSION ---
  useEffect(() => {
    const initApp = async () => {
        try {
            // 1. Initialize Database Schema
            await dbService.initSchema();

            // 2. Fetch Real Data
            await refreshData();

            // 3. Restore Session
            const storedUserId = localStorage.getItem('fut_dom_user_id');
            if (storedUserId) {
                console.log("🔄 Restoring session for:", storedUserId);
                const user = await dbService.getUserById(storedUserId);
                if (user) {
                    setActiveUser(user);
                    setShowLanding(false); 
                    checkNotifications(user.id);
                    if (user.role === UserRole.OWNER && user.onboardingCompleted) {
                        setCurrentTab('team');
                    }
                    checkTutorialStatus();
                } else {
                    localStorage.removeItem('fut_dom_user_id');
                }
            }
        } catch (error) {
            console.error("Initialization failed", error);
            setInitError("Falha ao conectar ao banco de dados. Verifique a internet ou recarregue.");
        } finally {
            setIsInitializing(false);
        }
    };

    initApp();

    // --- AUTO-UPDATE POLLING (SIMULATES REAL-TIME) ---
    // Polls every 15 seconds to check for new data
    intervalRef.current = window.setInterval(() => {
        refreshData();
    }, 15000);

    return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const checkTutorialStatus = () => {
      const seen = localStorage.getItem('fut_dom_tutorial_seen');
      if (!seen) {
          setTimeout(() => setShowTutorial(true), 1500);
      }
  };

  const handleTutorialComplete = () => {
      localStorage.setItem('fut_dom_tutorial_seen', 'true');
      setShowTutorial(false);
  };

  const checkNotifications = async (userId: string) => {
      const notifs = await dbService.getNotifications(userId);
      setHasUnread(notifs.some(n => !n.read));
  };

  const refreshData = async () => {
      const [fetchedTeams, fetchedMatches, fetchedTerritories, fetchedCourts, fetchedPickup] = await Promise.all([
        dbService.getTeams(),
        dbService.getMatches(),
        dbService.getTerritories(),
        dbService.getCourts(),
        dbService.getPickupGames()
      ]);
      setTeams(fetchedTeams);
      setMatches(fetchedMatches);
      setTerritories(fetchedTerritories);
      setCourts(fetchedCourts);
      setPickupGames(fetchedPickup);
      
      // Also update notification status silently
      if(activeUser) {
          // Note: we don't update activeUser full object here to avoid UI flickering, just notifications
          checkNotifications(activeUser.id);
      }
  };

  const handleLogin = (user: User) => {
    localStorage.setItem('fut_dom_user_id', user.id);
    setActiveUser(user);
    setShowLanding(false);
    refreshData();
    if (user.role === UserRole.OWNER && user.onboardingCompleted) {
      setCurrentTab('team');
    } else {
      setCurrentTab('map');
    }
    checkTutorialStatus();
  };

  const handleLogout = () => {
    localStorage.removeItem('fut_dom_user_id');
    setActiveUser(null);
    setCurrentTab('map');
    setShowLanding(true); 
  };

  const handleUserUpdate = (updatedUser: User) => {
    setActiveUser(updatedUser);
    refreshData();
  };

  const handleOnboardingComplete = (finalUser: User) => {
      setActiveUser(finalUser);
      refreshData();
      if (finalUser.role === UserRole.OWNER) {
          setCurrentTab('team');
      } else {
          setCurrentTab('map');
      }
      checkTutorialStatus();
  };

  const handleViewPlayer = (user: User) => {
      setViewingPlayer(user);
      setPlayerLiked(false); 
  };

  const handleLikePlayer = async () => {
      if (!viewingPlayer || !activeUser || viewingPlayer.id === activeUser.id) return;
      
      const success = await dbService.likePlayer(viewingPlayer.id, activeUser.id, activeUser.name);
      if (success) {
          setPlayerLiked(true);
          setViewingPlayer(prev => prev ? {...prev, likes: prev.likes + 1} : null);
      } else {
          setPlayerLiked(true); 
      }
  };

  const tutorialSteps: TutorialStep[] = [
      {
          targetId: 'welcome-center', 
          title: 'Bem-vindo ao Domination',
          content: 'Aqui começa sua jornada para conquistar o território. Vamos fazer um tour rápido?',
          position: 'center'
      },
      {
          targetId: 'mobile-menu-btn',
          title: 'Menu Principal',
          content: 'Acesse Peladas, Mercado, Rankings e gerencie seu Time por aqui.',
          position: 'bottom'
      },
      {
          targetId: 'map-status-badge',
          title: 'Mapa de Territórios',
          content: 'Veja em tempo real quem domina cada bairro. Toque nos escudos para desafiar!',
          position: 'bottom'
      },
      {
          targetId: 'header-notifs-btn',
          title: 'Central de Avisos',
          content: 'Convites para jogos, pedidos de transferência e alertas aparecem aqui.',
          position: 'left'
      },
      {
          targetId: 'header-profile-btn',
          title: 'Seu Perfil',
          content: 'Personalize seu card de jogador, veja suas estatísticas e troféus.',
          position: 'left'
      }
  ];

  if (isInitializing) {
      return (
        <div className="min-h-screen bg-pitch-950 flex flex-col items-center justify-center">
            <div className="text-4xl font-display font-bold text-white mb-4 tracking-wider animate-pulse">
                FUT<span className="text-neon">-DOM</span>
            </div>
            <div className="w-8 h-8 border-4 border-neon border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 text-xs mt-4">Conectando ao SQLite Cloud...</p>
        </div>
      );
  }

  if (initError) {
      return (
        <div className="min-h-screen bg-pitch-950 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Erro de Conexão</h2>
            <p className="text-red-400 mb-6">{initError}</p>
            <button onClick={() => window.location.reload()} className="bg-neon text-black font-bold px-6 py-2 rounded-lg hover:scale-105 transition-transform">
                Tentar Novamente
            </button>
        </div>
      );
  }

  if (!activeUser && showLanding) {
      return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  if (!activeUser) {
    return (
      <Auth onLogin={handleLogin} />
    );
  }

  if (!activeUser.onboardingCompleted) {
      return (
          <Onboarding user={activeUser} onComplete={handleOnboardingComplete} />
      );
  }

  const myTeam = teams.find(t => t.id === activeUser.teamId) || {
    id: 'temp', name: 'Sem Time', logoUrl: '', wins:0, losses:0, draws:0, players:[], territoryColor:'#ccc', category: 'Society', ownerId:'' 
  } as Team;

  const userRole = activeUser.role;

  return (
    <div className="min-h-screen bg-pitch-950 bg-mesh bg-fixed font-sans text-gray-100 overflow-x-hidden selection:bg-neon selection:text-black">
      
      {showTutorial && (
          <TutorialOverlay 
              steps={tutorialSteps} 
              onComplete={handleTutorialComplete} 
              onSkip={handleTutorialComplete} 
          />
      )}

      <Navigation 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        userRole={userRole} 
        onLogout={handleLogout}
      />

      <main className="md:ml-64 w-full min-h-screen relative pb-8 transition-all duration-300">
        {currentTab !== 'map' && (
          <header className="px-6 pt-16 pb-6 md:pt-8 md:px-8 flex justify-between items-center sticky top-0 z-30 transition-all duration-300 backdrop-blur-md bg-pitch-950/50 border-b border-white/5">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase italic tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {currentTab === 'feed' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Zona do Torcedor</span>}
                {currentTab === 'calendar' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-green-500">Match Center</span>}
                {currentTab === 'pickup' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500">Pelada Local</span>}
                {currentTab === 'team' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-green-600">Meu Elenco</span>}
                {currentTab === 'market' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Mercado</span>}
                {currentTab === 'profile' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-600">Modo Carreira</span>}
                {currentTab === 'rank' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Classificação</span>}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
                <button 
                  id="header-notifs-btn"
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {hasUnread && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black"></div>}
                </button>

                <div id="header-profile-btn" className="w-10 h-10 rounded-full border-2 border-neon p-0.5 shadow-neon cursor-pointer active:scale-95 transition-transform" onClick={() => setCurrentTab('profile')}>
                   <img src={activeUser.avatarUrl} className="w-full h-full rounded-full object-cover" />
                </div>
            </div>
          </header>
        )}

        <div className="px-0 md:px-8 max-w-7xl mx-auto h-full md:mt-4">
          
          {currentTab === 'map' && (
             <div className="fixed inset-0 md:static md:h-auto md:w-full z-0 bg-pitch-950">
                 <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10 md:hidden"></div>
                 <div className="fixed top-4 right-4 z-20 md:hidden pointer-events-auto flex gap-2">
                        <button id="header-notifs-btn" onClick={() => setShowNotifications(true)} className="p-2.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 relative shadow-lg active:scale-95 transition-transform">
                             <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                             {hasUnread && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-black shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>}
                        </button>
                        <div id="header-profile-btn" className="w-11 h-11 rounded-full border-2 border-neon p-0.5 shadow-[0_0_10px_rgba(57,255,20,0.3)] bg-black/40 backdrop-blur cursor-pointer active:scale-95 transition-transform" onClick={() => setCurrentTab('profile')}>
                           <img src={activeUser.avatarUrl} className="w-full h-full rounded-full object-cover" />
                        </div>
                 </div>
                 
                 {userRole === UserRole.OWNER && (
                    <div className="hidden md:flex justify-end mb-4 relative z-10">
                        <button 
                            onClick={() => setShowMatchLogger(true)}
                            className="bg-neon text-pitch-950 font-display font-bold text-xl px-8 py-2 rounded-xl shadow-neon hover:shadow-neon-hover hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <span>⚔️</span> REGISTRAR JOGO OFICIAL
                        </button>
                    </div>
                 )}
                 {userRole === UserRole.OWNER && (
                    <div className="fixed top-20 right-4 z-20 md:hidden pointer-events-auto">
                        <button 
                            onClick={() => setShowMatchLogger(true)}
                            className="bg-neon text-pitch-950 w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.5)] font-bold text-2xl active:scale-90 transition-transform animate-pulse-slow border-2 border-white"
                        >
                            ⚔️
                        </button>
                    </div>
                 )}

                 <TerritoryMap 
                    territories={territories} 
                    teams={teams} 
                    courts={courts}
                    pickupGames={pickupGames}
                    currentUser={activeUser}
                    onCourtAdded={refreshData}
                 />
             </div>
          )}

          <div className="animate-[fadeIn_0.5s_ease-out] px-4 md:px-0">
            {currentTab === 'pickup' && <PickupSoccer currentUser={activeUser} onViewPlayer={handleViewPlayer} />}
            {currentTab === 'calendar' && <MatchCalendar matches={matches} teams={teams} currentUser={activeUser} onViewPlayer={handleViewPlayer} />}
            {currentTab === 'feed' && <Feed posts={MOCK_POSTS} currentUser={activeUser} />}
            {currentTab === 'team' && <TeamManagement team={myTeam} currentUser={activeUser} onViewPlayer={handleViewPlayer} />}
            {currentTab === 'market' && <TransferMarket teams={teams} currentUser={activeUser} onViewPlayer={handleViewPlayer} />}
            {currentTab === 'profile' && <Profile user={activeUser} matches={matches} onUpdateUser={handleUserUpdate} onLogout={handleLogout} />}
            {currentTab === 'rank' && <Rankings teams={teams} currentUser={activeUser} />}
          </div>
        </div>
      </main>

      {/* --- MODAL FOR VIEWING PLAYER PROFILE --- */}
      {viewingPlayer && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[2000] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setViewingPlayer(null)}>
              <div 
                  className="w-full max-w-sm relative" 
                  onClick={e => e.stopPropagation()} 
              >
                  <button 
                      onClick={() => setViewingPlayer(null)}
                      className="absolute -top-12 right-0 bg-white/10 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20"
                  >
                      ✕
                  </button>

                  <div className="relative group perspective-1000">
                     {/* Animated Glow Behind */}
                     <div className="absolute -inset-1 bg-gradient-to-r from-neon via-blue-500 to-purple-600 rounded-[2.2rem] blur opacity-40 animate-pulse"></div>
                     
                     <div className="relative bg-pitch-950 bg-carbon rounded-[2rem] p-1 border border-white/10 shadow-2xl">
                         {/* Card Inner Content */}
                         <div className="bg-gradient-to-b from-pitch-900/90 to-black/95 rounded-[1.8rem] p-6 text-white backdrop-blur-sm relative overflow-hidden">
                             
                             {/* Background Shine */}
                             <div className="absolute top-0 right-0 w-[200%] h-full bg-gradient-to-l from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"></div>
            
                             <div className="flex justify-between items-start mb-4 relative z-10">
                                 <div className="flex flex-col">
                                    <span className="text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-neon to-green-600 leading-none filter drop-shadow-sm">
                                        {viewingPlayer.role === UserRole.OWNER ? '92' : viewingPlayer.stats?.rating || '75'}
                                    </span>
                                    <span className="text-sm uppercase font-bold text-pitch-300 tracking-widest ml-1">OVR</span>
                                 </div>
                                 <div className="text-right">
                                     <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Flag_of_Brazil.svg" className="w-10 h-7 rounded shadow-md inline-block mb-1 border border-white/10" />
                                     <p className="text-xs font-bold text-pitch-400 tracking-wide uppercase">
                                         {viewingPlayer.role === UserRole.OWNER ? 'DONO' : viewingPlayer.position || 'JOGADOR'}
                                     </p>
                                 </div>
                             </div>
                             
                             <div className="relative w-48 h-48 mx-auto mb-2 z-10">
                                 <div className="absolute inset-0 bg-neon/20 rounded-full blur-[50px] opacity-50"></div>
                                 <img src={viewingPlayer.avatarUrl} className="w-full h-full object-cover drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] z-20 relative rounded-xl" />
                                 
                                 {/* LIKE BUTTON OVERLAY */}
                                 {activeUser && activeUser.id !== viewingPlayer.id && (
                                     <button 
                                        onClick={handleLikePlayer}
                                        disabled={playerLiked}
                                        className={`absolute bottom-0 right-0 p-3 rounded-full shadow-2xl border-2 transition-all transform active:scale-90 ${playerLiked ? 'bg-red-500 border-red-400 scale-110' : 'bg-black/50 border-white/30 hover:scale-110 hover:bg-white/10'}`}
                                     >
                                         <span className={`text-2xl ${playerLiked ? 'animate-bounce' : ''}`}>❤️</span>
                                     </button>
                                 )}
                             </div>
                             
                             <div className="text-center mb-4 relative z-10">
                                <h2 className="text-4xl font-display font-bold uppercase tracking-wider mb-1">
                                    {viewingPlayer.name}
                                </h2>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-gray-400 text-xs uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">
                                        {viewingPlayer.likes} Curtidas
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs mt-2 italic">"{viewingPlayer.bio || "Sem biografia..."}"</p>
                             </div>
                             
                             <div className="grid grid-cols-3 gap-2 text-center relative z-10">
                                 <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                                    <span className="block font-display text-2xl font-bold text-neon">{viewingPlayer.stats?.matchesPlayed || 0}</span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Jogos</span>
                                 </div>
                                 <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                                    <span className="block font-display text-2xl font-bold text-neon">{viewingPlayer.stats?.goals || 0}</span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Gols</span>
                                 </div>
                                 <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                                    <span className="block font-display text-2xl font-bold text-gold">{viewingPlayer.stats?.mvps || 0}</span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">MVP</span>
                                 </div>
                             </div>

                             {/* Badges Preview */}
                             {viewingPlayer.badges && viewingPlayer.badges.length > 0 && (
                                 <div className="mt-4 pt-4 border-t border-white/10 flex gap-2 justify-center overflow-x-auto">
                                     {viewingPlayer.badges.map((b, i) => (
                                         <div key={i} className="text-xl bg-black/40 p-1.5 rounded-lg border border-white/5" title={b}>🏆</div>
                                     ))}
                                 </div>
                             )}
                         </div>
                     </div>
                  </div>
              </div>
          </div>
      )}

      {showMatchLogger && userRole === UserRole.OWNER && (
          <MatchLogger 
            onClose={() => { setShowMatchLogger(false); refreshData(); }} 
            currentUser={activeUser}
            userTeamId={activeUser.teamId!}
          />
      )}

      {showNotifications && (
          <NotificationsModal 
              currentUser={activeUser} 
              onClose={() => setShowNotifications(false)} 
              onRefresh={refreshData}
          />
      )}
      
    </div>
  );
};

export default App;