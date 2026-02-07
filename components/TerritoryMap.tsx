import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Territory, Team, Court, PickupGame, User, UserRole } from '../types';
import { dbService } from '../services/database';

interface TerritoryMapProps {
  territories: Territory[];
  teams: Team[];
  courts?: Court[];
  pickupGames?: PickupGame[];
  currentUser?: User;
  onCourtAdded?: () => void; // Used for general map refreshes now
}

// --- ICONS ---
const createTerritoryIcon = (team: Team | undefined, territoryPoints: number) => {
  const color = team ? team.territoryColor : '#64748b';
  const logo = team?.logoUrl || 'https://www.svgrepo.com/show/530412/shield.svg';
  
  return L.divIcon({
    className: 'custom-territory-marker',
    html: `
      <div class="relative w-14 h-14 group">
        <div class="absolute inset-0 bg-[${color}] rounded-full blur-md opacity-40 group-hover:opacity-80 transition-opacity duration-500 animate-pulse"></div>
        <div class="relative w-12 h-12 top-1 left-1 rounded-full border-[3px] bg-pitch-950 overflow-hidden shadow-2xl z-10 transition-transform duration-300 group-hover:-translate-y-2" style="border-color: ${color}">
           ${team ? `<img src="${logo}" class="w-full h-full object-cover" />` : `<div class="w-full h-full flex items-center justify-center text-gray-600">🏳️</div>`}
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-display font-bold px-2 py-0.5 rounded border border-[${color}] z-20 shadow-lg whitespace-nowrap">
          ${territoryPoints} PTS
        </div>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
};

const createCourtIcon = (isPaid: boolean) => {
    const color = isPaid ? '#fbbf24' : '#39ff14';
    const icon = isPaid ? '💲' : '⚽';
    return L.divIcon({
        className: 'custom-court-marker',
        html: `
          <div class="relative w-14 h-14 group">
            <div class="absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-80 transition-opacity duration-500 animate-pulse" style="background-color: ${color}"></div>
            <div class="relative w-12 h-12 top-1 left-1 rounded-full border-[3px] bg-pitch-950 flex items-center justify-center shadow-2xl z-10 transition-transform duration-300 group-hover:-translate-y-2" style="border-color: ${color}">
               <span class="text-2xl">${icon}</span>
            </div>
          </div>
        `,
        iconSize: [56, 56],
        iconAnchor: [28, 28],
    });
};

const UserLocationController = ({ onLocationFound }: { onLocationFound: (lat: number, lng: number) => void }) => {
    const map = useMap();
    const [position, setPosition] = useState<[number, number] | null>(null);

    useEffect(() => {
        map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
        const handleLocationFound = (e: L.LocationEvent) => {
            setPosition([e.latlng.lat, e.latlng.lng]);
            onLocationFound(e.latlng.lat, e.latlng.lng);
        };
        map.on("locationfound", handleLocationFound);
        return () => { map.off("locationfound", handleLocationFound); };
    }, [map]);

    const radarIcon = L.divIcon({
        className: 'user-radar',
        html: `
           <div class="relative w-8 h-8 flex items-center justify-center">
             <div class="absolute w-full h-full bg-neon rounded-full animate-ping opacity-75"></div>
             <div class="relative w-3 h-3 bg-white rounded-full border-2 border-neon shadow-[0_0_10px_#39ff14]"></div>
           </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
    return position ? <Marker position={position} icon={radarIcon} zIndexOffset={1000} /> : null;
};

const AddCourtClickController = ({ isActive, onMapClick }: { isActive: boolean, onMapClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            if (isActive) onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const RecenterButton = () => {
    const map = useMap();
    return (
        <button 
            onClick={(e) => { e.stopPropagation(); map.locate({ setView: true, maxZoom: 16 }); }}
            className="absolute bottom-24 right-4 md:bottom-8 md:right-4 z-[500] bg-pitch-950 p-3 rounded-full border border-white/20 shadow-lg text-white hover:text-neon hover:border-neon active:scale-95 transition-all"
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
    );
};

export const TerritoryMap: React.FC<TerritoryMapProps> = ({ territories, teams, courts = [], pickupGames = [], currentUser, onCourtAdded }) => {
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [isAddingCourt, setIsAddingCourt] = useState(false);
  const [newCourtPos, setNewCourtPos] = useState<{lat: number, lng: number} | null>(null);
  const [newCourtForm, setNewCourtForm] = useState({ name: '', isPaid: false });
  const [isSaving, setIsSaving] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const handleSaveCourt = async () => {
      if (!newCourtPos || !newCourtForm.name) return;
      setIsSaving(true);
      try {
          const newCourt: Court = {
              id: `court-${Date.now()}`,
              name: newCourtForm.name,
              isPaid: newCourtForm.isPaid,
              lat: newCourtPos.lat,
              lng: newCourtPos.lng,
              address: 'Local Sinalizado no Mapa', 
              cep: '', number: '', phone: '',
              registeredByTeamId: currentUser?.teamId || 'user_signal',
              rating: 0, ratingCount: 0
          };
          await dbService.createCourt(newCourt);
          alert("Quadra sinalizada com sucesso!");
          setNewCourtPos(null);
          setNewCourtForm({ name: '', isPaid: false });
          setIsAddingCourt(false);
          if (onCourtAdded) onCourtAdded();
      } catch (e) {
          alert("Erro ao salvar quadra.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleClaimTerritory = async () => {
      if (!currentUser?.teamId || currentUser.role !== UserRole.OWNER) {
          alert("Apenas donos de time podem conquistar territórios!");
          return;
      }
      if (!selectedTerritory) return;

      if (!window.confirm(`Deseja reivindicar o território "${selectedTerritory.name}" para o seu time?`)) return;

      setIsSaving(true);
      const res = await dbService.claimTerritory(selectedTerritory.id, currentUser.teamId);
      
      if (res.success) {
          alert(res.message);
          setSelectedTerritory(null);
          if (onCourtAdded) onCourtAdded(); // Refresh map data
      } else {
          alert(res.message);
      }
      setIsSaving(false);
  };

  return (
    <div className="relative w-full h-full md:h-[calc(100vh-100px)] overflow-hidden bg-pitch-950 md:rounded-3xl md:border border-white/10 shadow-2xl">
      <MapContainer center={[-23.5505, -46.6333]} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%", background: '#020617' }} zoomControl={false}>
        <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <UserLocationController onLocationFound={(lat, lng) => {}} />
        <RecenterButton />
        <AddCourtClickController isActive={isAddingCourt} onMapClick={(lat, lng) => setNewCourtPos({ lat, lng })} />
        
        {territories.map((t) => {
            const owner = teams.find(team => team.id === t.ownerTeamId);
            return <Marker key={`terr-${t.id}`} position={[t.lat, t.lng]} icon={createTerritoryIcon(owner, t.points)} eventHandlers={{ click: () => { if (isAddingCourt) return; setSelectedCourt(null); setSelectedTerritory(t); }}} />;
        })}

        {courts.map((c) => (
            <Marker key={`court-${c.id}`} position={[c.lat, c.lng]} icon={createCourtIcon(c.isPaid)} eventHandlers={{ click: () => { if (isAddingCourt) return; setSelectedTerritory(null); setSelectedCourt(c); setUserRating(0); }}} />
        ))}

        {newCourtPos && <Marker position={[newCourtPos.lat, newCourtPos.lng]} icon={createCourtIcon(newCourtForm.isPaid)} />}
      </MapContainer>

      {!isAddingCourt && (
        <div id="map-status-badge" className="absolute top-6 left-1/2 -translate-x-1/2 md:top-4 md:left-4 md:translate-x-0 z-[400] pointer-events-none">
            <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-neon/30 flex items-center gap-2.5 shadow-lg animate-fadeIn">
                <span className="text-[10px] font-display font-bold text-white uppercase tracking-widest leading-none">
                    Ao Vivo <span className="text-gray-500 mx-1">•</span> {territories.length} Zonas • {courts.length} Quadras
                </span>
            </div>
        </div>
      )}

      {!isAddingCourt && !newCourtPos && (
          <button onClick={() => setIsAddingCourt(true)} className="absolute bottom-24 left-4 md:bottom-8 md:left-4 z-[500] bg-neon text-black p-4 rounded-full shadow-[0_0_20px_rgba(57,255,20,0.5)] active:scale-95 transition-transform flex items-center gap-2 font-bold group">
              <span className="text-2xl leading-none">+</span>
          </button>
      )}

      {isAddingCourt && !newCourtPos && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-neon text-white shadow-2xl animate-bounce">
              <p className="font-bold text-sm">Toque no mapa onde fica a quadra 📍</p>
              <button onClick={() => setIsAddingCourt(false)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
          </div>
      )}

      {newCourtPos && (
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-[1000] flex justify-center items-end pointer-events-none">
              <div className="bg-pitch-950 border border-white/20 p-6 rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto animate-slideUp">
                  <h3 className="text-xl font-display font-bold text-white uppercase italic mb-4">Sinalizar Nova Quadra</h3>
                  <div className="space-y-4">
                      <input type="text" value={newCourtForm.name} onChange={e => setNewCourtForm({...newCourtForm, name: e.target.value})} placeholder="Nome do Local..." className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-neon focus:outline-none" autoFocus />
                      <div className="flex gap-3 pt-2">
                          <button onClick={() => { setNewCourtPos(null); setIsAddingCourt(false); }} className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl">Cancelar</button>
                          <button onClick={handleSaveCourt} disabled={!newCourtForm.name || isSaving} className="flex-1 py-3 bg-neon text-black font-bold rounded-xl shadow-neon">{isSaving ? '...' : 'Confirmar ✅'}</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {selectedTerritory && (
        <div className="absolute bottom-20 left-2 right-2 md:bottom-6 md:left-6 md:right-auto md:w-96 z-[1000] animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
           <div className="bg-pitch-950/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden group ring-1 ring-white/5">
               <button onClick={(e) => { e.stopPropagation(); setSelectedTerritory(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-20">✕</button>
               <div className="flex items-center gap-4 mb-5 relative z-10 pr-8">
                   <div className="relative">
                        <div className={`w-16 h-16 rounded-2xl bg-black border-2 p-1 shadow-lg ${selectedTerritory.ownerTeamId ? 'border-red-500 shadow-red-900/20' : 'border-neon shadow-neon/20'}`}>
                                {teams.find(t => t.id === selectedTerritory.ownerTeamId)?.logoUrl ? <img src={teams.find(t => t.id === selectedTerritory.ownerTeamId)?.logoUrl} className="w-full h-full object-cover rounded-xl" /> : <div className="w-full h-full flex items-center justify-center text-2xl text-gray-600">🏳️</div>}
                        </div>
                   </div>
                   <div>
                       <h3 className="text-xl font-display font-bold text-white uppercase leading-tight mb-1">{selectedTerritory.name}</h3>
                       {selectedTerritory.ownerTeamId ? <div className="flex items-center gap-1.5"><span className="text-[10px] text-red-400 uppercase font-bold tracking-wider">Dominado por</span><span className="text-xs text-white font-bold truncate max-w-[120px]">{teams.find(t => t.id === selectedTerritory.ownerTeamId)?.name}</span></div> : <span className="text-xs text-neon uppercase font-bold tracking-widest bg-neon/10 px-2 py-0.5 rounded">Território Livre</span>}
                   </div>
               </div>
               
               {/* CLAIM BUTTON */}
               <button 
                  onClick={handleClaimTerritory}
                  disabled={isSaving}
                  className={`w-full font-bold py-3.5 rounded-xl uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all relative z-10 ${
                   selectedTerritory.ownerTeamId 
                   ? 'bg-red-600 text-white shadow-red-900/30' 
                   : 'bg-neon text-black shadow-neon/30'
               }`}>
                  {isSaving ? 'Processando...' : (selectedTerritory.ownerTeamId ? '⚔️ Desafiar Dono' : '🚩 Reivindicar Agora')}
               </button>
           </div>
        </div>
      )}

      {selectedCourt && (
        <div className="absolute bottom-20 left-2 right-2 md:bottom-6 md:left-6 md:right-auto md:w-96 z-[1000] animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
           <div className="bg-pitch-950/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden group ring-1 ring-white/5 flex flex-col max-h-[70vh]">
               <button onClick={(e) => { e.stopPropagation(); setSelectedCourt(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-20">✕</button>
               <div className="flex items-center gap-4 mb-5 relative z-10 pr-8">
                   <div className="relative">
                        <div className={`w-16 h-16 rounded-2xl bg-black border-2 p-1 shadow-lg flex items-center justify-center ${selectedCourt.isPaid ? 'border-gold shadow-gold/20' : 'border-neon shadow-neon/20'}`}>
                            <span className="text-3xl">{selectedCourt.isPaid ? '💲' : '⚽'}</span>
                        </div>
                   </div>
                   <div>
                       <h3 className="text-xl font-display font-bold text-white uppercase leading-tight mb-1">{selectedCourt.name}</h3>
                       <div className="flex gap-2">
                           <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider bg-white/5 px-2 py-0.5 rounded">Quadra</span>
                           {selectedCourt.isPaid ? <span className="text-[10px] bg-gold text-black px-2 py-0.5 rounded uppercase font-bold tracking-wider">Paga</span> : <span className="text-[10px] bg-neon text-black px-2 py-0.5 rounded uppercase font-bold tracking-wider">Grátis</span>}
                       </div>
                   </div>
               </div>
               <a href={`https://www.google.com/maps/search/?api=1&query=${selectedCourt.lat},${selectedCourt.lng}`} target="_blank" rel="noreferrer" className="block w-full text-center font-bold py-3.5 rounded-xl uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all relative z-10 flex-shrink-0 bg-white/10 hover:bg-white/20 text-white">
                  🗺️ Navegar (GPS)
               </a>
           </div>
        </div>
      )}
    </div>
  );
};