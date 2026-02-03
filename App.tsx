import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { TerritoryMap } from './components/TerritoryMap';
import { GenAIStudio } from './components/GenAIStudio';
import { Feed } from './components/Feed';
import { Auth } from './components/Auth';
import { TeamManagement } from './components/TeamManagement';
import { MatchLogger } from './components/MatchLogger';
import { Profile } from './components/Profile';
import { Rankings } from './components/Rankings';
import { CURRENT_USER, MOCK_TEAMS, MOCK_TERRITORIES, MOCK_POSTS, MOCK_MATCHES } from './constants';
import { UserRole } from './types';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.FAN); // Default to Fan until login
  const [currentTab, setCurrentTab] = useState('map');
  const [showMatchLogger, setShowMatchLogger] = useState(false);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsLoggedIn(true);
    // On first login, default owner to team creation or team view, fan to map
    setCurrentTab(role === UserRole.OWNER ? 'team' : 'map');
  };

  if (!isLoggedIn) {
    return <Auth onLogin={handleLogin} />;
  }

  // Simulate data based on role for the demo
  // Ensure we merge the role into the current user mock
  const activeUser = { ...CURRENT_USER, role: userRole };
  const myTeam = MOCK_TEAMS.find(t => t.id === activeUser.teamId) || MOCK_TEAMS[0];

  return (
    <div className="min-h-screen bg-pitch-950 bg-mesh bg-fixed font-sans text-gray-100 overflow-x-hidden selection:bg-neon selection:text-black">
      
      <Navigation 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        userRole={userRole} 
        onLogout={() => setIsLoggedIn(false)}
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
            {currentTab === 'profile' && <Profile user={activeUser} matches={MOCK_MATCHES} />}
            {currentTab === 'rank' && <Rankings teams={MOCK_TEAMS} />}
          </div>

        </div>
      </main>

      {/* Modal Overlay - Only accessible to owners */}
      {showMatchLogger && userRole === UserRole.OWNER && <MatchLogger onClose={() => setShowMatchLogger(false)} />}
    </div>
  );
};

export default App;