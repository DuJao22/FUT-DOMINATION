import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { TerritoryMap } from './components/TerritoryMap';
import { GenAIStudio } from './components/GenAIStudio';
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
import { TutorialOverlay, TutorialStep } from './components/TutorialOverlay'; // NEW
import { MOCK_POSTS } from './constants'; 
import { UserRole, User, Team, Match, Territory, Court, PickupGame } from './types';
import { dbService } from './services/database';

const App: React.FC = () => {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('map');
  const [showMatchLogger, setShowMatchLogger] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  
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

  // --- INITIALIZATION & SESSION ---
  useEffect(() => {
    const initApp = async () => {
        try {
            // 1. Initialize Database Schema (Create tables if new)
            await dbService.initSchema();

            // 2. Fetch Real Data
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

            // 3. Restore Session
            const storedUserId = localStorage.getItem('fut_dom_user_id');
            if (storedUserId) {
                console.log("🔄 Restoring session for:", storedUserId);
                const user = await dbService.getUserById(storedUserId);
                if (user) {
                    setActiveUser(user);
                    checkNotifications(user.id); // Check notifs on load
                    if (user.role === UserRole.OWNER && user.onboardingCompleted) {
                        setCurrentTab('team');
                    }
                    // Check Tutorial
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
  }, []);

  const checkTutorialStatus = () => {
      const seen = localStorage.getItem('fut_dom_tutorial_seen');
      if (!seen) {
          // Pequeno delay para garantir que a UI carregou
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

  // Refresh data helper
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
      
      // Update active user info if needed
      if(activeUser) {
          const updatedUser = await dbService.getUserById(activeUser.id);
          if(updatedUser) setActiveUser(updatedUser);
          checkNotifications(activeUser.id);
      }
  };

  const handleLogin = (user: User) => {
    localStorage.setItem('fut_dom_user_id', user.id);
    setActiveUser(user);
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
  };

  const handleUserUpdate = (updatedUser: User) => {
    setActiveUser(updatedUser);
    refreshData();
  };

  // --- ONBOARDING COMPLETION HANDLER ---
  const handleOnboardingComplete = (finalUser: User) => {
      setActiveUser(finalUser);
      refreshData(); // Refresh to see new team if created
      if (finalUser.role === UserRole.OWNER) {
          setCurrentTab('team');
      } else {
          setCurrentTab('map');
      }
      checkTutorialStatus();
  };

  // --- TUTORIAL STEPS DEFINITION ---
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
          position: 'bottom' // Ajusta automaticamente se desktop/mobile
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

  if (!activeUser) {
    return (
      <>
        <Auth onLogin={handleLogin} />
      </>
    );
  }

  // --- MANDATORY ONBOARDING CHECK ---
  if (!activeUser.onboardingCompleted) {
      return (
          <Onboarding user={activeUser} onComplete={handleOnboardingComplete} />
      );
  }

  // Find the team associated with the user
  const myTeam = teams.find(t => t.id === activeUser.teamId) || {
    id: 'temp', name: 'Sem Time', logoUrl: '', wins:0, losses:0, draws:0, players:[], territoryColor:'#ccc', category: 'Society', ownerId:'' 
  } as Team;

  const userRole = activeUser.role;

  return (
    <div className="min-h-screen bg-pitch-950 bg-mesh bg-fixed font-sans text-gray-100 overflow-x-hidden selection:bg-neon selection:text-black">
      
      {/* TUTORIAL OVERLAY */}
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

      {/* Main Content Area - md:ml-64 ensures space for fixed sidebar on desktop */}
      <main className="md:ml-64 w-full min-h-screen relative pb-8 transition-all duration-300">
        
        {/* Header with Title and Notification Bell */}
        {currentTab !== 'map' && (
          <header className="px-6 pt-16 pb-6 md:pt-8 md:px-8 flex justify-between items-center sticky top-0 z-30 transition-all duration-300 backdrop-blur-md bg-pitch-950/50 border-b border-white/5">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase italic tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {currentTab === 'feed' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Zona do Torcedor</span>}
                {currentTab === 'calendar' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-green-500">Match Center</span>}
                {currentTab === 'pickup' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500">Pelada Local</span>}
                {currentTab === 'studio' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Estúdio Criativo</span>}
                {currentTab === 'team' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-green-600">Meu Elenco</span>}
                {currentTab === 'market' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Mercado</span>}
                {currentTab === 'profile' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-600">Modo Carreira</span>}
                {currentTab === 'rank' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Classificação</span>}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <button 
                  id="header-notifs-btn"
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {hasUnread && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black"></div>}
                </button>

                {/* Profile Pic */}
                <div id="header-profile-btn" className="w-10 h-10 rounded-full border-2 border-neon p-0.5 shadow-neon cursor-pointer active:scale-95 transition-transform" onClick={() => setCurrentTab('profile')}>
                   <img src={activeUser.avatarUrl} className="w-full h-full rounded-full object-cover" />
                </div>
            </div>
          </header>
        )}

        <div className="px-0 md:px-8 max-w-7xl mx-auto h-full md:mt-4">
          
          {currentTab === 'map' && (
             // Usando fixed inset-0 para garantir tela cheia no mobile sem scrolls indesejados
             <div className="fixed inset-0 md:static md:h-auto md:w-full z-0 bg-pitch-950">
                 
                 {/* Mobile Map Gradient Overlay for better UI visibility */}
                 <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10 md:hidden"></div>

                 {/* Map Header Controls - Fixed to top right */}
                 <div className="fixed top-4 right-4 z-20 md:hidden pointer-events-auto flex gap-2">
                        <button id="header-notifs-btn" onClick={() => setShowNotifications(true)} className="p-2.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 relative shadow-lg active:scale-95 transition-transform">
                             <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                             {hasUnread && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-black shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>}
                        </button>
                        <div id="header-profile-btn" className="w-11 h-11 rounded-full border-2 border-neon p-0.5 shadow-[0_0_10px_rgba(57,255,20,0.3)] bg-black/40 backdrop-blur cursor-pointer active:scale-95 transition-transform" onClick={() => setCurrentTab('profile')}>
                           <img src={activeUser.avatarUrl} className="w-full h-full rounded-full object-cover" />
                        </div>
                 </div>
                 
                 {/* Desktop Header Actions */}
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
                 {/* Mobile Floating Action Button */}
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
                 />
             </div>
          )}

          <div className="animate-[fadeIn_0.5s_ease-out] px-4 md:px-0">
            {currentTab === 'pickup' && <PickupSoccer currentUser={activeUser} />}
            {currentTab === 'calendar' && <MatchCalendar matches={matches} teams={teams} currentUser={activeUser} />}
            {currentTab === 'studio' && <GenAIStudio />}
            {currentTab === 'feed' && <Feed posts={MOCK_POSTS} currentUser={activeUser} />}
            {currentTab === 'team' && <TeamManagement team={myTeam} currentUserRole={userRole} />}
            {currentTab === 'market' && <TransferMarket teams={teams} currentUser={activeUser} />}
            {currentTab === 'profile' && <Profile user={activeUser} matches={matches} onUpdateUser={handleUserUpdate} onLogout={handleLogout} />}
            {currentTab === 'rank' && <Rankings teams={teams} />}
          </div>

        </div>
      </main>

      {/* MODALS */}
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