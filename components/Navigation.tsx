import React from 'react';
import { UserRole } from '../types';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, setCurrentTab, userRole, onLogout }) => {
  const navItems = [
    { id: 'map', label: 'Mapa', icon: (active: boolean) => (
      <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'fill-neon drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]' : 'fill-gray-400 group-hover:fill-gray-200'}`} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
    )},
    { id: 'team', label: 'Time', icon: (active: boolean) => (
      <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'fill-neon drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]' : 'fill-gray-400 group-hover:fill-gray-200'}`} viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
    )},
    { id: 'feed', label: 'Clube', icon: (active: boolean) => (
      <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'fill-neon drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]' : 'fill-gray-400 group-hover:fill-gray-200'}`} viewBox="0 0 24 24"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg>
    )},
    { id: 'rank', label: 'Ranking', icon: (active: boolean) => (
       <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'fill-neon drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]' : 'fill-gray-400 group-hover:fill-gray-200'}`} viewBox="0 0 24 24"><path d="M16 11V3H8v6H2v12h20V11h-6zm-6-6h4v14h-4V5zm-6 6h4v8H4v-8zm16 8h-4v-6h4v6z"/></svg>
    )},
    { id: 'profile', label: 'Perfil', icon: (active: boolean) => (
       <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'fill-neon drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]' : 'fill-gray-400 group-hover:fill-gray-200'}`} viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
    )},
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 bg-pitch-950 border-r border-pitch-900 h-screen fixed left-0 top-0 p-6 z-50">
        <h1 className="text-4xl font-display font-bold text-white mb-10 tracking-wider">
          FUT<span className="text-neon">-DOM</span>
        </h1>
        <div className="flex flex-col gap-4 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group ${
                currentTab === item.id
                  ? 'bg-pitch-900 border border-pitch-800 shadow-neon-shadow'
                  : 'hover:bg-pitch-900/50'
              }`}
            >
              <div className="transform group-hover:scale-110 transition-transform">{item.icon(currentTab === item.id)}</div>
              <span className={`text-lg font-medium ${currentTab === item.id ? 'text-white' : 'text-gray-500'}`}>{item.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onLogout} className="text-left text-danger font-bold mt-auto px-4">Sair</button>
      </nav>

      {/* Mobile Floating Dock - Redesigned */}
      <nav className="md:hidden fixed bottom-5 left-4 right-4 h-20 z-[900]">
        <div className="absolute inset-0 bg-pitch-950/90 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex justify-between items-center px-6 overflow-hidden">
          
          {/* Subtle gradient overlay */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className="group relative flex flex-col items-center justify-center w-14 h-full"
              >
                {/* Active Light Beam Background */}
                {isActive && (
                  <div className="absolute top-0 w-8 h-full bg-gradient-to-b from-neon/10 via-neon/5 to-transparent blur-sm rounded-full"></div>
                )}

                {/* Icon Container */}
                <div className={`relative z-10 transition-transform duration-300 ${isActive ? '-translate-y-1 scale-110' : 'group-active:scale-95'}`}>
                  {item.icon(isActive)}
                </div>

                {/* Active Indicator Dot */}
                <div 
                   className={`absolute bottom-4 w-1 h-1 rounded-full bg-neon shadow-[0_0_10px_#39ff14] transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
                ></div>
                
                {/* Optional Label (Hidden for minimalism, shown on Active if desired) */}
                {/* {isActive && <span className="absolute bottom-2 text-[8px] font-bold text-neon uppercase tracking-widest opacity-80 animate-fadeIn"></span>} */}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};