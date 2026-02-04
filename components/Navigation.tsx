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
    { id: 'market', label: 'Mercado', icon: (active: boolean) => (
       <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'fill-neon drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]' : 'fill-gray-400 group-hover:fill-gray-200'}`} viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>
    )},
    { id: 'team', label: 'Meu Time', icon: (active: boolean) => (
      <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'fill-neon drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]' : 'fill-gray-400 group-hover:fill-gray-200'}`} viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
    )},
    { id: 'feed', label: 'Clube', icon: (active: boolean) => (
      <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'fill-neon drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]' : 'fill-gray-400 group-hover:fill-gray-200'}`} viewBox="0 0 24 24"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg>
    )},
    { id: 'rank', label: 'Rankings', icon: (active: boolean) => (
       <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'fill-neon drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]' : 'fill-gray-400 group-hover:fill-gray-200'}`} viewBox="0 0 24 24"><path d="M16 11V3H8v6H2v12h20V11h-6zm-6-6h4v14h-4V5zm-6 6h4v8H4v-8zm16 8h-4v-6h4v6z"/></svg>
    )},
    { id: 'profile', label: 'Perfil', icon: (active: boolean) => (
       <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'fill-neon drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]' : 'fill-gray-400 group-hover:fill-gray-200'}`} viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
    )},
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR (Hidden on mobile) */}
      <nav className="hidden md:flex flex-col w-64 bg-pitch-950 border-r border-white/10 h-screen fixed left-0 top-0 p-6 z-50">
        <div className="mb-10 px-2">
            <h1 className="text-4xl font-display font-bold text-white tracking-wider">
            FUT<span className="text-neon">-DOM</span>
            </h1>
            <p className="text-xs text-gray-500 tracking-widest mt-1 uppercase">Domine o Território</p>
        </div>
        
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                currentTab === item.id
                  ? 'bg-white/10 border border-neon/30 shadow-[0_0_15px_rgba(57,255,20,0.1)]'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className={`transform transition-transform duration-300 ${currentTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon(currentTab === item.id)}
              </div>
              <span className={`text-sm font-bold uppercase tracking-wide ${currentTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                  {item.label}
              </span>
              
              {/* Active Indicator Line */}
              {currentTab === item.id && (
                  <div className="ml-auto w-1 h-4 bg-neon rounded-full shadow-[0_0_8px_#39ff14]"></div>
              )}
            </button>
          ))}
        </div>

        <button 
            onClick={onLogout} 
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors mt-auto group"
        >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="text-sm font-bold uppercase">Sair</span>
        </button>
      </nav>

      {/* MOBILE DOCK (Hidden on desktop) */}
      <nav className="md:hidden fixed bottom-5 left-4 right-4 h-20 z-[900]">
        <div className="absolute inset-0 bg-pitch-950/90 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex justify-between items-center px-4 overflow-hidden">
          
          {/* Subtle gradient overlay */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className="group relative flex flex-col items-center justify-center w-12 h-full"
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
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};