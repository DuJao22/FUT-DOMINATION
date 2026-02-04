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
import { PickupSoccer } from './components/PickupSoccer'; // NEW
import { Profile } from './components/Profile';
import { Rankings } from './components/Rankings';
import { TransferMarket } from './components/TransferMarket';
import { NotificationsModal } from './components/NotificationsModal';
import { MOCK_POSTS } from './constants'; 
import { UserRole, User, Team, Match, Territory } from './types';
import { dbService } from './services/database';

const App: React.FC = () => {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('map');
  const [showMatchLogger, setShowMatchLogger] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // --- APP STATE (FROM DB) ---
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);

  // --- INITIALIZATION & SESSION ---
  useEffect(() => {
    const initApp = async () => {
        try {
            // 1. Initialize Database Schema (Create tables if new)
            await dbService.initSchema();

            // 2. Fetch Real Data
            const [fetchedTeams, fetchedMatches, fetchedTerritories] = await Promise.all([
                dbService.getTeams(),
                dbService.getMatches(),
                dbService.getTerritories()
            ]);

            setTeams(fetchedTeams);
            setMatches(fetchedMatches);
            setTerritories(fetchedTerritories);

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

  const checkNotifications = async (userId: string) => {
      const notifs = await dbService.getNotifications(userId);
      setHasUnread(notifs.some(n => !n.read));
  };

  // Refresh data helper
  const refreshData = async () => {
      const [fetchedTeams, fetchedMatches, fetchedTerritories] = await Promise.all([
        dbService.getTeams(),
        dbService.getMatches(),
        dbService.getTerritories()
      ]);
      setTeams(fetchedTeams);
      setMatches(fetchedMatches);
      setTerritories(fetchedTerritories);
      
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
  };

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
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {hasUnread && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black"></div>}
                </button>

                {/* Profile Pic */}
                <div className="w-10 h-10 rounded-full border-2 border-neon p-0.5 shadow-neon cursor-pointer active:scale-95 transition-transform" onClick={() => setCurrentTab('profile')}>
                   <img src={activeUser.avatarUrl} className="w-full h-full rounded-full object-cover" />
                </div>
            </div>
          </header>
        )}

        <div className="px-4 md:px-8 max-w-7xl mx-auto h-full mt-4">
          
          {currentTab === 'map' && (
             <div className="h-screen w-full absolute top-0 left-0 pt-0 md:pt-0 md:relative md:h-auto">
                 {/* Map Header Overlay - Adjusted for Mobile Sidebar Button */}
                 <div className="absolute top-5 left-16 right-6 z-10 md:hidden pointer-events-none flex justify-between items-start">
                    <h1 className="text-4xl font-display font-bold text-white drop-shadow-md tracking-wider">DOMINATION</h1>
                    <div className="pointer-events-auto flex gap-2">
                        <button onClick={() => setShowNotifications(true)} className="p-2 bg-black/60 backdrop-blur rounded-full border border-white/10 relative">
                             <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                             {hasUnread && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black"></div>}
                        </button>
                        <div className="w-10 h-10 rounded-full border-2 border-neon p-0.5 shadow-neon bg-black" onClick={() => setCurrentTab('profile')}>
                           <img src={activeUser.avatarUrl} className="w-full h-full rounded-full object-cover" />
                        </div>
                    </div>
                 </div>
                 
                 {userRole === UserRole.OWNER && (
                    <div className="hidden md:flex justify-end mb-4">
                        <button 
                            onClick={() => setShowMatchLogger(true)}
                            className="bg-neon text-pitch-950 font-display font-bold text-xl px-8 py-2 rounded-xl shadow-neon hover:shadow-neon-hover hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <span>⚔️</span> REGISTRAR JOGO OFICIAL
                        </button>
                    </div>
                 )}
                 {userRole === UserRole.OWNER && (
                    <div className="absolute top-28 right-6 z-10 md:hidden">
                        <button 
                            onClick={() => setShowMatchLogger(true)}
                            className="bg-neon text-pitch-950 w-12 h-12 rounded-full flex items-center justify-center shadow-neon font-bold text-2xl active:scale-90 transition-transform animate-pulse-slow"
                        >
                            ⚔️
                        </button>
                    </div>
                 )}

                 <TerritoryMap territories={territories} teams={teams} />
             </div>
          )}

          <div className="animate-[fadeIn_0.5s_ease-out]">
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