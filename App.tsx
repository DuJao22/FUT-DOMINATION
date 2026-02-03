import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { TerritoryMap } from './components/TerritoryMap';
import { GenAIStudio } from './components/GenAIStudio';
import { Feed } from './components/Feed';
import { Auth } from './components/Auth';
import { TeamManagement } from './components/TeamManagement';
import { MatchLogger } from './components/MatchLogger';
import { Profile } from './components/Profile';
import { Rankings } from './components/Rankings';
import { MOCK_TEAMS, MOCK_TERRITORIES, MOCK_POSTS, MOCK_MATCHES } from './constants';
import { UserRole, User } from './types';
import { dbService } from './services/database';

// Reload Icon Component (Relicon)
const ReloadButton = () => (
  <button 
    onClick={() => window.location.reload()} 
    className="fixed bottom-4 right-4 z-[9999] bg-pitch-900/80 backdrop-blur border border-white/20 text-white p-3 rounded-full shadow-2xl hover:bg-neon hover:text-black transition-all group"
    title="Recarregar App"
  >
    <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  </button>
);

const App: React.FC = () => {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('map');
  const [showMatchLogger, setShowMatchLogger] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // --- SESSION PERSISTENCE ---
  useEffect(() => {
    const restoreSession = async () => {
        const storedUserId = localStorage.getItem('fut_dom_user_id');
        if (storedUserId) {
            try {
                console.log("🔄 Restoring session for:", storedUserId);
                const user = await dbService.getUserById(storedUserId);
                if (user) {
                    setActiveUser(user);
                    if (user.role === UserRole.OWNER) {
                         setCurrentTab('team');
                    }
                } else {
                    // Invalid ID in storage
                    localStorage.removeItem('fut_dom_user_id');
                }
            } catch (error) {
                console.error("Session restore failed", error);
            }
        }
        setIsInitializing(false);
    };

    restoreSession();
  }, []);

  const handleLogin = (user: User) => {
    // Save to local storage for persistence
    localStorage.setItem('fut_dom_user_id', user.id);
    setActiveUser(user);
    if (user.role === UserRole.OWNER) {
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

  // Called when user upgrades to Owner inside Profile
  const handleUserUpdate = (updatedUser: User) => {
    // Update local state and storage if needed (storage usually just needs ID)
    setActiveUser(updatedUser);
  };

  if (isInitializing) {
      return (
        <div className="min-h-screen bg-pitch-950 flex flex-col items-center justify-center">
            <div className="text-4xl font-display font-bold text-white mb-4 tracking-wider animate-pulse">
                FUT<span className="text-neon">-DOM</span>
            </div>
            <div className="w-8 h-8 border-4 border-neon border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
  }

  if (!activeUser) {
    return (
      <>
        <Auth onLogin={handleLogin} />
        <ReloadButton />
      </>
    );
  }

  // Find the team associated with the user (if any)
  // Note: In a full DB implementation, we would fetch this team async, but for hybrid approach we use constants as fallback
  // or MOCK_TEAMS until we fully replace the Feed/Map with DB calls.
  const myTeam = MOCK_TEAMS.find(t => t.id === activeUser.teamId) || MOCK_TEAMS[0];

  // Derive simple role for easier checks
  const userRole = activeUser.role;

  return (
    <div className="min-h-screen bg-pitch-950 bg-mesh bg-fixed font-sans text-gray-100 overflow-x-hidden selection:bg-neon selection:text-black">
      
      <Navigation 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        userRole={userRole} 
        onLogout={handleLogout}
      />

      {/* Main Content Area - Mobile Optimized */}
      <main className="md:ml-64 w-full min-h-screen relative pb-28 md:pb-8">
        
        {/* Dynamic Header */}
        {currentTab !== 'map' && (
          <header className="px-6 pt-12 pb-6 md:pt-8 md:px-8 flex justify-between items-center sticky top-0 z-30 transition-all duration-300 backdrop-blur-md bg-pitch-950/50 border-b border-white/5">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase italic tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {currentTab === 'feed' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Zona do Torcedor</span>}
                {currentTab === 'studio' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Estúdio Criativo</span>}
                {currentTab === 'team' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-green-600">Meu Elenco</span>}
                {currentTab === 'profile' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-600">Modo Carreira</span>}
                {currentTab === 'rank' && <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Classificação</span>}
              </h1>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-neon p-0.5 shadow-neon cursor-pointer active:scale-95 transition-transform" onClick={() => setCurrentTab('profile')}>
               <img src={activeUser.avatarUrl} className="w-full h-full rounded-full object-cover" />
            </div>
          </header>
        )}

        <div className="px-4 md:px-8 max-w-7xl mx-auto h-full mt-4">
          
          {/* MAP VIEW */}
          {currentTab === 'map' && (
             <div className="h-screen w-full absolute top-0 left-0 pt-0 md:pt-8 md:relative md:h-auto">
                 <div className="absolute top-12 left-6 z-10 md:hidden pointer-events-none">
                    <h1 className="text-4xl font-display font-bold text-white drop-shadow-md tracking-wider">DOMINATION</h1>
                 </div>
                 
                 {userRole === UserRole.OWNER && (
                    <>
                        <div className="absolute top-12 right-6 z-10 md:hidden">
                            <button 
                                onClick={() => setShowMatchLogger(true)}
                                className="bg-neon text-pitch-950 w-12 h-12 rounded-full flex items-center justify-center shadow-neon font-bold text-2xl active:scale-90 transition-transform animate-pulse-slow"
                            >
                                ⚔️
                            </button>
                        </div>
                        {/* Desktop Only Button */}
                        <div className="hidden md:flex justify-end mb-4">
                            <button 
                                onClick={() => setShowMatchLogger(true)}
                                className="bg-neon text-pitch-950 font-display font-bold text-xl px-8 py-2 rounded-xl shadow-neon hover:shadow-neon-hover hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <span>⚔️</span> REGISTRAR JOGO OFICIAL
                            </button>
                        </div>
                    </>
                 )}

                 <TerritoryMap territories={MOCK_TERRITORIES} teams={MOCK_TEAMS} />
             </div>
          )}

          {/* OTHER TABS - Wrapped in fade animation */}
          <div className="animate-[fadeIn_0.5s_ease-out]">
            {currentTab === 'studio' && <GenAIStudio />}
            {/* Pass current user to Feed for Following Logic */}
            {currentTab === 'feed' && <Feed posts={MOCK_POSTS} currentUser={activeUser} />}
            {currentTab === 'team' && <TeamManagement team={myTeam} currentUserRole={userRole} />}
            {currentTab === 'profile' && <Profile user={activeUser} matches={MOCK_MATCHES} onUpdateUser={handleUserUpdate} />}
            {currentTab === 'rank' && <Rankings teams={MOCK_TEAMS} />}
          </div>

        </div>
      </main>

      {/* Modal Overlay - Only accessible to owners */}
      {showMatchLogger && userRole === UserRole.OWNER && <MatchLogger onClose={() => setShowMatchLogger(false)} />}
      
      {/* Relicon available everywhere */}
      <ReloadButton />
    </div>
  );
};

export default App;
