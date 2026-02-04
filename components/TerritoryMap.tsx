import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Territory, Team } from '../types';

interface TerritoryMapProps {
  territories: Territory[];
  teams: Team[];
}

// Function to create a custom HTML marker for teams
// Refactored for cleaner HTML and subtler animations
const createCustomIcon = (team: Team | undefined, territoryPoints: number) => {
  const color = team ? team.territoryColor : '#64748b'; // Default gray
  const logo = team?.logoUrl || 'https://www.svgrepo.com/show/530412/shield.svg';
  
  // Optimized HTML: Reduced DOM complexity inside the marker
  // Animation: Changed from aggressive ping to a subtle pulse/glow
  return L.divIcon({
    className: 'custom-marker-optimized',
    html: `
      <div class="relative w-12 h-12 flex items-center justify-center transition-transform duration-500 hover:scale-110">
        
        <!-- Subtle Glow Layer (Visible for owned territories) -->
        ${team ? `
          <div class="absolute inset-0 rounded-full opacity-40 blur-md animate-pulse" style="background-color: ${color}; box-shadow: 0 0 15px ${color}"></div>
        ` : ''}
        
        <!-- Main Marker Container -->
        <div class="relative w-10 h-10 rounded-full border-2 bg-black overflow-hidden flex items-center justify-center z-10 shadow-lg" style="border-color: ${color}">
           ${team ? `<img src="${logo}" class="w-full h-full object-cover opacity-90" />` : `<span class="text-lg opacity-50">🏳️</span>`}
        </div>
        
        <!-- Points Badge (Floats slightly) -->
        <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm whitespace-nowrap z-20" style="color: ${color}; border-color: ${color}">
          ${territoryPoints}
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -28]
  });
};

const UserLocationMarker = () => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const map = useMap();

    useEffect(() => {
        // Locate user immediately and set view
        map.locate({ 
            setView: true, 
            maxZoom: 16,
            enableHighAccuracy: true 
        });

        const onLocationFound = (e: L.LocationEvent) => {
            setPosition([e.latlng.lat, e.latlng.lng]);
        };

        map.on("locationfound", onLocationFound);

        return () => {
            map.off("locationfound", onLocationFound);
        };
    }, [map]);

    const userIcon = L.divIcon({
        className: 'user-marker',
        html: `
           <div class="relative w-6 h-6">
             <div class="absolute inset-0 bg-neon rounded-full animate-ping opacity-75"></div>
             <div class="relative w-6 h-6 bg-neon rounded-full border-2 border-white shadow-lg"></div>
           </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    return position === null ? null : (
        <Marker position={position} icon={userIcon}>
            <Popup>Você está aqui</Popup>
        </Marker>
    );
};

export const TerritoryMap: React.FC<TerritoryMapProps> = ({ territories, teams }) => {
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  
  // Default center acts as a placeholder only until UserLocationMarker kicks in
  const defaultCenter: [number, number] = [40.7128, -74.0060];

  // --- OPTIMIZATION: MEMOIZE MARKERS ---
  // This prevents react-leaflet from re-creating markers on every render cycle
  // drastically improving performance when panning/zooming or opening modals.
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
    <div className="relative w-full h-full md:h-[600px] overflow-hidden md:rounded-3xl border-t md:border border-pitch-800 shadow-2xl bg-[#0f172a]">
      
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        zoomControl={false}
      >
        {/* Dark Matter Tiles for Premium Look */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <UserLocationMarker />

        {/* Render Memoized Markers */}
        {territoryMarkers}

      </MapContainer>

      {/* Floating UI Controls */}
      <div className="absolute top-24 left-4 md:top-4 md:left-4 bg-black/80 backdrop-blur px-3 py-1 rounded-full border border-neon/30 flex items-center gap-2 z-[400] shadow-lg pointer-events-none">
         <div className="w-2 h-2 bg-neon rounded-full animate-pulse"></div>
         <span className="text-xs font-bold text-neon uppercase tracking-wider">Mapa ao Vivo</span>
      </div>

      {/* Bottom Sheet for Territory Details */}
      {selectedTerritory && (
        <div className="absolute bottom-24 left-4 right-4 md:bottom-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl animate-slideUp z-[500]">
           <div className="flex justify-between items-start mb-2">
              <div>
                  <h3 className="text-xl font-display font-bold text-white uppercase tracking-wide">{selectedTerritory.name}</h3>
                  <p className="text-gray-400 text-xs">Lat: {selectedTerritory.lat.toFixed(4)} • Lng: {selectedTerritory.lng.toFixed(4)}</p>
              </div>
              <button onClick={() => setSelectedTerritory(null)} className="text-gray-500 hover:text-white bg-white/5 rounded-full p-1">
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              </button>
           </div>
           
           <div className="mt-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 overflow-hidden ${selectedTerritory.ownerTeamId ? 'border-neon bg-neon/10' : 'border-gray-600 bg-gray-800'}`}>
                 {teams.find(t => t.id === selectedTerritory.ownerTeamId)?.logoUrl ? 
                    <img src={teams.find(t => t.id === selectedTerritory.ownerTeamId)?.logoUrl} className="w-full h-full object-cover" /> : 
                    "🏳️"
                 }
              </div>
              <div className="flex-1">
                 <p className="text-xs text-gray-400 uppercase font-bold">Dominador</p>
                 <p className="text-white font-bold text-lg">{teams.find(t => t.id === selectedTerritory.ownerTeamId)?.name || "Território Sem Dono"}</p>
              </div>
              <div className="text-right">
                 <p className="text-xs text-gray-400 uppercase font-bold">Valor</p>
                 <p className="text-neon font-display text-2xl font-bold">{selectedTerritory.points} PTS</p>
              </div>
           </div>
           
           <button className="w-full mt-4 bg-neon text-black font-bold py-3 rounded-xl uppercase tracking-widest shadow-neon-shadow active:scale-95 transition-transform">
              Desafiar Aqui
           </button>
        </div>
      )}
    </div>
  );
};