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

      {/* OVERLAY: Status Badge (Centered for Mobile) */}
      <div id="map-status-badge" className="absolute top-6 left-1/2 -translate-x-1/2 md:top-4 md:left-4 md:translate-x-0 z-[400] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-neon/30 flex items-center gap-2.5 shadow-lg animate-fadeIn">
             <div className="relative">
                 <div className="w-2 h-2 bg-neon rounded-full animate-none"></div>
                 <div className="absolute inset-0 bg-neon rounded-full animate-ping opacity-75"></div>
             </div>
             <span className="text-[10px] font-display font-bold text-white uppercase tracking-widest leading-none">
                 Ao Vivo <span className="text-gray-500 mx-1">•</span> {territories.length} Zonas
             </span>
          </div>
      </div>

      {/* OVERLAY: Bottom Sheet Territory Details */}
      {selectedTerritory && (
        <div className="absolute bottom-20 left-2 right-2 md:bottom-6 md:left-6 md:right-auto md:w-96 z-[1000] animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
           <div className="bg-pitch-950/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden group ring-1 ring-white/5">
               
               {/* Close Button */}
               <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedTerritory(null); }} 
                  className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-20"
               >
                 ✕
               </button>

               <div className="flex items-center gap-4 mb-5 relative z-10 pr-8">
                   {/* Logo with status ring */}
                   <div className="relative">
                        <div className={`w-16 h-16 rounded-2xl bg-black border-2 p-1 shadow-lg ${selectedTerritory.ownerTeamId ? 'border-red-500 shadow-red-900/20' : 'border-neon shadow-neon/20'}`}>
                                {teams.find(t => t.id === selectedTerritory.ownerTeamId)?.logoUrl ? (
                                    <img src={teams.find(t => t.id === selectedTerritory.ownerTeamId)?.logoUrl} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl text-gray-600">🏳️</div>
                                )}
                        </div>
                        {selectedTerritory.ownerTeamId && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 border-2 border-black rounded-full"></div>}
                   </div>

                   <div>
                       <h3 className="text-xl font-display font-bold text-white uppercase leading-tight mb-1">{selectedTerritory.name}</h3>
                       {selectedTerritory.ownerTeamId ? (
                           <div className="flex items-center gap-1.5">
                               <span className="text-[10px] text-red-400 uppercase font-bold tracking-wider">Dominado por</span>
                               <span className="text-xs text-white font-bold truncate max-w-[120px]">{teams.find(t => t.id === selectedTerritory.ownerTeamId)?.name}</span>
                           </div>
                       ) : (
                           <span className="text-xs text-neon uppercase font-bold tracking-widest bg-neon/10 px-2 py-0.5 rounded">Território Livre</span>
                       )}
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
                   <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center">
                       <p className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Valor</p>
                       <p className="text-xl font-display font-bold text-white">{selectedTerritory.points} <span className="text-xs text-gray-500">PTS</span></p>
                   </div>
                   <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center">
                       <p className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Status</p>
                       <p className={`text-sm font-bold ${selectedTerritory.ownerTeamId ? 'text-red-400' : 'text-neon'}`}>
                           {selectedTerritory.ownerTeamId ? '🛡️ Protegido' : '🔓 Disponível'}
                       </p>
                   </div>
               </div>
               
               <button className={`w-full font-bold py-3.5 rounded-xl uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all relative z-10 ${
                   selectedTerritory.ownerTeamId 
                   ? 'bg-red-600 text-white shadow-red-900/30' 
                   : 'bg-neon text-black shadow-neon/30'
               }`}>
                  {selectedTerritory.ownerTeamId ? '⚔️ Desafiar Dono' : '🚩 Reivindicar Agora'}
               </button>

               {/* Decorative Gradient */}
               <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none ${selectedTerritory.ownerTeamId ? 'bg-red-600' : 'bg-neon'}`}></div>

           </div>
        </div>
      )}
    </div>
  );
};