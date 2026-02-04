import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Territory, Team } from '../types';

interface TerritoryMapProps {
  territories: Territory[];
  teams: Team[];
}

// 1. DESIGN PREMIUM DOS MARCADORES DE TIME
const createCustomIcon = (team: Team | undefined, territoryPoints: number) => {
  const color = team ? team.territoryColor : '#64748b'; // Cinza se sem dono
  const logo = team?.logoUrl || 'https://www.svgrepo.com/show/530412/shield.svg';
  
  // HTML injetado no mapa: Efeito de brilho + Borda Neon + Badge de Pontos
  return L.divIcon({
    className: 'custom-territory-marker',
    html: `
      <div class="relative w-14 h-14 group">
        <!-- Glow Effect (Behind) -->
        <div class="absolute inset-0 bg-[${color}] rounded-full blur-md opacity-40 group-hover:opacity-80 transition-opacity duration-500 animate-pulse"></div>
        
        <!-- Main Token -->
        <div class="relative w-12 h-12 top-1 left-1 rounded-full border-[3px] bg-pitch-950 overflow-hidden shadow-2xl z-10 transition-transform duration-300 group-hover:-translate-y-2" style="border-color: ${color}">
           ${team ? `<img src="${logo}" class="w-full h-full object-cover" />` : `<div class="w-full h-full flex items-center justify-center text-gray-600">🏳️</div>`}
        </div>
        
        <!-- Points Badge -->
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-display font-bold px-2 py-0.5 rounded border border-[${color}] z-20 shadow-lg whitespace-nowrap">
          ${territoryPoints} PTS
        </div>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
};

// 2. MARCADOR DE USUÁRIO TIPO "RADAR"
const UserLocationMarker = () => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const map = useMap();

    useEffect(() => {
        map.locate({ 
            setView: true, 
            maxZoom: 15,
            enableHighAccuracy: true 
        });

        const onLocationFound = (e: L.LocationEvent) => {
            setPosition([e.latlng.lat, e.latlng.lng]);
        };

        map.on("locationfound", onLocationFound);
        return () => { map.off("locationfound", onLocationFound); };
    }, [map]);

    const radarIcon = L.divIcon({
        className: 'user-radar',
        html: `
           <div class="relative w-8 h-8 flex items-center justify-center">
             <div class="absolute w-full h-full bg-neon rounded-full animate-ping opacity-75"></div>
             <div class="absolute w-full h-full bg-neon rounded-full opacity-20 animate-pulse"></div>
             <div class="relative w-3 h-3 bg-white rounded-full border-2 border-neon shadow-[0_0_10px_#39ff14]"></div>
           </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    return position === null ? null : (
        <Marker position={position} icon={radarIcon} zIndexOffset={1000} />
    );
};

export const TerritoryMap: React.FC<TerritoryMapProps> = ({ territories, teams }) => {
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  
  // Center placeholder (NYC) -> Will be overridden by user location
  const defaultCenter: [number, number] = [40.7128, -74.0060];

  // Memoize markers for performance
  const territoryMarkers = useMemo(() => {
      return territories.map((t) => {
          const owner = teams.find(team => team.id === t.ownerTeamId);
          return (
              <Marker 
                  key={t.id} 
                  position={[t.lat, t.lng]} 
                  icon={createCustomIcon(owner, t.points)}
                  // @ts-ignore
                  eventHandlers={{
                      click: () => {
                          setSelectedTerritory(t);
                      },
                  }}
              />
          );
      });
  }, [territories, teams]);

  return (
    <div className="relative w-full h-full md:h-[calc(100vh-100px)] overflow-hidden bg-pitch-950 md:rounded-3xl md:border border-white/10 shadow-2xl">
      
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", background: '#020617' }} // Fundo preto para evitar flash branco
        zoomControl={false}
      >
        {/* TILE DARK MODE (CartoDB Dark Matter) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <UserLocationMarker />
        {territoryMarkers}

      </MapContainer>

      {/* OVERLAY: Status do Mapa */}
      <div className="absolute top-24 left-4 md:top-4 md:left-4 z-[400] flex flex-col gap-2 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-neon/30 flex items-center gap-2 shadow-lg animate-fadeIn w-fit">
             <div className="w-2 h-2 bg-neon rounded-full animate-pulse shadow-[0_0_8px_#39ff14]"></div>
             <span className="text-[10px] font-bold text-white uppercase tracking-wider">Ao Vivo • {territories.length} Zonas</span>
          </div>
      </div>

      {/* OVERLAY: Card de Detalhes do Território (Bottom Sheet) */}
      {selectedTerritory && (
        <div className="absolute bottom-0 left-0 right-0 md:bottom-6 md:left-6 md:right-auto md:w-96 z-[500] p-4 animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
           <div className="bg-black/80 backdrop-blur-xl border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden group">
               
               {/* Background Gradient based on owner color */}
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon via-white to-transparent opacity-50"></div>
               
               {/* Close Button */}
               <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedTerritory(null); }} 
                  className="absolute top-4 right-4 text-gray-500 hover:text-white bg-white/5 hover:bg-white/20 rounded-full p-2 transition-colors z-20"
               >
                 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"></path></svg>
               </button>

               <div className="flex items-start gap-4 mb-4 relative z-10">
                   {/* Big Logo */}
                   <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 p-1 shadow-lg relative">
                        {teams.find(t => t.id === selectedTerritory.ownerTeamId)?.logoUrl ? (
                            <img src={teams.find(t => t.id === selectedTerritory.ownerTeamId)?.logoUrl} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🏳️</div>
                        )}
                        {/* Status Dot */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black ${selectedTerritory.ownerTeamId ? 'bg-red-500' : 'bg-green-500'}`}></div>
                   </div>

                   <div>
                       <h3 className="text-2xl font-display font-bold text-white uppercase leading-none mb-1">{selectedTerritory.name}</h3>
                       <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                               {selectedTerritory.ownerTeamId ? 'Dominado por' : 'Disponível'}
                           </span>
                           {selectedTerritory.ownerTeamId && (
                               <span className="text-[10px] font-bold text-white uppercase bg-white/10 px-2 py-0.5 rounded">
                                   {teams.find(t => t.id === selectedTerritory.ownerTeamId)?.name}
                               </span>
                           )}
                       </div>
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                   <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                       <p className="text-[9px] text-gray-400 uppercase font-bold">Valor</p>
                       <p className="text-xl font-display font-bold text-neon">{selectedTerritory.points} PTS</p>
                   </div>
                   <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                       <p className="text-[9px] text-gray-400 uppercase font-bold">Status</p>
                       <p className="text-sm font-bold text-white">{selectedTerritory.ownerTeamId ? '🛡️ Protegido' : '🔓 Livre'}</p>
                   </div>
               </div>
               
               <button className="w-full bg-neon text-black font-bold py-4 rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:scale-[1.02] active:scale-95 transition-all relative z-10">
                  {selectedTerritory.ownerTeamId ? '⚔️ Desafiar Dono' : '🚩 Reivindicar'}
               </button>

           </div>
        </div>
      )}
    </div>
  );
};