import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { dbService } from '../services/database';
import { Match, User, Court, Team, UserRole } from '../types';

// Helper to sort courts by distance
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

// Component to handle map clicks AND programmatic updates
const LocationController = ({ 
    onLocationSelect, 
    forcedPosition 
}: { 
    onLocationSelect: (lat: number, lng: number) => void, 
    forcedPosition?: {lat: number, lng: number} | null 
}) => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const map = useMap();
    
    // Icon for selection
    const selectionIcon = L.divIcon({
        className: 'selection-marker',
        html: `<div class="w-8 h-8 text-3xl drop-shadow-md">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });

    // 1. Handle Map Clicks
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    // 2. Handle External Updates (e.g. from CEP search)
    useEffect(() => {
        if (forcedPosition) {
            const newPos: [number, number] = [forcedPosition.lat, forcedPosition.lng];
            setPosition(newPos);
            map.flyTo(newPos, 16, { animate: true });
        }
    }, [forcedPosition, map]);

    // 3. Locate user on mount if no position
    useEffect(() => {
        if (!forcedPosition && !position) {
             map.locate().on("locationfound", function (e) {
                // Only fly to user if we haven't selected anything yet
                if (!position) { 
                    map.flyTo(e.latlng, 15);
                }
            });
        }
    }, [map]);

    return position ? <Marker position={position} icon={selectionIcon} /> : null;
};

interface MatchLoggerProps {
    onClose: () => void;
    currentUser: User;
    userTeamId: string;
}

export const MatchLogger: React.FC<MatchLoggerProps> = ({ onClose, currentUser, userTeamId }) => {
  // Modes: 'select_court' -> 'match_details' -> 'done'
  // Or 'select_court' -> 'register_court' -> 'select_court'
  const [step, setStep] = useState<'select_court' | 'register_court' | 'match_details'>('select_court');
  
  // Data State
  const [courts, setCourts] = useState<Court[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Form State - Match
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>('');
  const [homeScore, setHomeScore] = useState<string>(''); // String to avoid "0" placeholder
  const [awayScore, setAwayScore] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Form State - New Court
  const [newCourtCoords, setNewCourtCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [courtForm, setCourtForm] = useState({
      name: '',
      address: '',
      number: '',
      cep: '',
      phone: ''
  });

  // --- INITIAL LOAD ---
  useEffect(() => {
      const loadData = async () => {
          const [fetchedCourts, fetchedTeams] = await Promise.all([
              dbService.getCourts(),
              dbService.getTeams()
          ]);
          setCourts(fetchedCourts);
          setTeams(fetchedTeams.filter(t => t.id !== userTeamId)); // Filter out own team
          
          // Get User Location for sorting
          if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                  setUserLocation({
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude
                  });
              });
          }
      };
      loadData();
  }, []);

  // Sort courts by distance
  const sortedCourts = React.useMemo(() => {
      if (!userLocation) return courts;
      return [...courts].sort((a, b) => {
          const distA = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, a.lat, a.lng);
          const distB = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
          return distA - distB;
      });
  }, [courts, userLocation]);


  // --- HANDLERS ---

  // Handle CEP auto-fill AND Geocoding
  const handleCepBlur = async () => {
      const rawCep = courtForm.cep.replace(/\D/g, '');
      
      if (rawCep.length === 8) {
          setIsLoadingCep(true);
          try {
              // 1. Get Address Data
              const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
              const data = await response.json();
              
              if (!data.erro) {
                  const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}, Brasil`;
                  
                  setCourtForm(prev => ({
                      ...prev,
                      address: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
                  }));

                  // 2. Geocode to get Lat/Lng for the Map
                  // Using OpenStreetMap Nominatim (Free, no key required for small usage)
                  try {
                      const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`);
                      const geoData = await geoResponse.json();
                      
                      if (geoData && geoData.length > 0) {
                          const lat = parseFloat(geoData[0].lat);
                          const lon = parseFloat(geoData[0].lon);
                          
                          // Update map coordinates state -> triggers flyTo in LocationController
                          setNewCourtCoords({ lat, lng: lon });
                      }
                  } catch (geoError) {
                      console.error("Geocoding failed", geoError);
                      // Fail silently on map, user can still click manually
                  }

              } else {
                  alert("CEP não encontrado.");
              }
          } catch (error) {
              console.error("Erro ao buscar CEP", error);
          } finally {
              setIsLoadingCep(false);
          }
      }
  };

  const handleRegisterCourt = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCourtCoords) {
          alert("Por favor, confirme a localização no mapa (toque no local correto).");
          return;
      }
      
      setIsSaving(true);
      try {
          const newCourt: Court = {
              id: `court-${Date.now()}`,
              ...courtForm,
              lat: newCourtCoords.lat,
              lng: newCourtCoords.lng,
              registeredByTeamId: userTeamId
          };
          await dbService.createCourt(newCourt);
          
          // Refresh courts and go back
          setCourts(prev => [...prev, newCourt]);
          setStep('select_court');
          setCourtForm({ name: '', address: '', number: '', cep: '', phone: '' });
          setNewCourtCoords(null);
          alert("Quadra cadastrada com sucesso!");

      } catch (err) {
          alert("Erro ao cadastrar quadra.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if(!selectedCourt) {
        alert("Erro: Nenhuma quadra selecionada.");
        return;
    }
    
    if (!selectedOpponentId) {
        alert("Selecione o time adversário.");
        return;
    }

    if (homeScore === '' || awayScore === '') {
        alert("Preencha o placar.");
        return;
    }

    setIsSaving(true);

    try {
        const opponentTeam = teams.find(t => t.id === selectedOpponentId);
        const newMatch: Match = {
            id: `m-${Date.now()}`,
            date: new Date(),
            locationName: selectedCourt.name,
            courtId: selectedCourt.id,
            homeTeamId: userTeamId,
            awayTeamName: opponentTeam?.name || "Desconhecido",
            awayTeamId: selectedOpponentId,
            homeScore: Number(homeScore),
            awayScore: Number(awayScore),
            isVerified: true
        };

        const success = await dbService.createMatch(newMatch);
        
        if (success) {
            alert("Jogo registrado com sucesso!");
            onClose();
        } else {
            alert("Erro ao salvar jogo. Tente novamente.");
        }
    } catch (e) {
        console.error(e);
        alert("Erro de conexão.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
      {/* Changed max-h logic and flex container to fix button overlap */}
      <div className="bg-pitch-900 border border-neon/50 rounded-none md:rounded-2xl w-full max-w-lg shadow-2xl shadow-neon/10 animate-fadeIn overflow-hidden flex flex-col h-full md:h-auto md:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-pitch-800 flex justify-between items-center bg-pitch-950 flex-shrink-0">
          <h2 className="text-lg md:text-xl font-display font-bold text-white uppercase">
              {step === 'select_court' && 'Onde vai ser o jogo?'}
              {step === 'register_court' && 'Cadastrar Nova Quadra'}
              {step === 'match_details' && 'Súmula da Partida'}
          </h2>
          <button onClick={onClose} className="text-pitch-400 hover:text-white bg-white/5 p-2 rounded-full">✕</button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-pitch-900/50">
            
            {/* STEP 1: SELECT COURT */}
            {step === 'select_court' && (
                <div className="p-4 space-y-4">
                    {/* Add Court Button (Owner Only) */}
                    {currentUser.role === UserRole.OWNER && (
                        <button 
                            onClick={() => setStep('register_court')}
                            className="w-full bg-pitch-800 border border-dashed border-pitch-600 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-pitch-700 hover:border-neon transition-all group"
                        >
                            <span className="text-2xl text-pitch-400 group-hover:text-neon">+</span>
                            <span className="font-bold text-pitch-300 group-hover:text-white">Cadastrar Nova Quadra</span>
                        </button>
                    )}

                    <div className="space-y-2 pb-4">
                        <p className="text-xs text-pitch-400 font-bold uppercase mb-2">Quadras Próximas</p>
                        {sortedCourts.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">Nenhuma quadra encontrada.</p>
                        ) : (
                            sortedCourts.map(court => (
                                <button
                                    key={court.id}
                                    onClick={() => {
                                        setSelectedCourt(court);
                                        setStep('match_details');
                                    }}
                                    className="w-full bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 hover:border-neon/30 transition-all text-left"
                                >
                                    <div>
                                        <h4 className="font-bold text-white">{court.name}</h4>
                                        <p className="text-xs text-gray-400">{court.address}, {court.number}</p>
                                    </div>
                                    <span className="text-2xl">🏟️</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* STEP 2: REGISTER COURT (Owner Only) */}
            {step === 'register_court' && (
                <div className="flex flex-col">
                     <div className="h-[250px] w-full relative flex-shrink-0 border-b border-pitch-800">
                         <MapContainer 
                            center={userLocation ? [userLocation.lat, userLocation.lng] : [40.7128, -74.0060]} 
                            zoom={15} 
                            style={{ height: "100%", width: "100%" }}
                            zoomControl={false}
                        >
                             <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                            {/* Updated Controller Component */}
                            <LocationController 
                                forcedPosition={newCourtCoords}
                                onLocationSelect={(lat, lng) => setNewCourtCoords({ lat, lng })} 
                            />
                         </MapContainer>
                         <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-full text-xs font-bold border border-neon/50 z-[1000] pointer-events-none text-center w-max">
                             {isLoadingCep ? 'Buscando local...' : 'Confirme o local no mapa'}
                         </div>
                     </div>
                     
                     <form id="court-form" onSubmit={handleRegisterCourt} className="p-4 space-y-4 pb-8">
                        <div>
                            <label className="block text-pitch-400 text-[10px] font-bold uppercase mb-1">Nome do Local</label>
                            <input 
                                required
                                type="text" 
                                className="w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-white focus:border-neon focus:outline-none"
                                placeholder="Ex: Arena Real"
                                value={courtForm.name}
                                onChange={e => setCourtForm({...courtForm, name: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-pitch-400 text-[10px] font-bold uppercase mb-1">CEP</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-white focus:border-neon focus:outline-none"
                                        placeholder="00000-000"
                                        value={courtForm.cep}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            const formatted = val.length > 5 ? `${val.slice(0,5)}-${val.slice(5,8)}` : val;
                                            setCourtForm({...courtForm, cep: formatted});
                                        }}
                                        onBlur={handleCepBlur}
                                        maxLength={9}
                                    />
                                    {isLoadingCep && (
                                        <div className="absolute right-3 top-3 w-4 h-4 border-2 border-neon border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                </div>
                             </div>
                             <div>
                                <label className="block text-pitch-400 text-[10px] font-bold uppercase mb-1">Número</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-white focus:border-neon focus:outline-none"
                                    placeholder="123"
                                    value={courtForm.number}
                                    onChange={e => setCourtForm({...courtForm, number: e.target.value})}
                                />
                             </div>
                        </div>
                        <div>
                            <label className="block text-pitch-400 text-[10px] font-bold uppercase mb-1">Endereço (Rua/Av)</label>
                            <input 
                                required
                                type="text" 
                                className={`w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-white focus:border-neon focus:outline-none ${isLoadingCep ? 'opacity-50' : ''}`}
                                placeholder="Rua das Palmeiras"
                                value={courtForm.address}
                                onChange={e => setCourtForm({...courtForm, address: e.target.value})}
                                readOnly={isLoadingCep}
                            />
                        </div>
                        <div>
                            <label className="block text-pitch-400 text-[10px] font-bold uppercase mb-1">Telefone da Quadra</label>
                            <input 
                                required
                                type="tel" 
                                className="w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-white focus:border-neon focus:outline-none"
                                placeholder="(11) 99999-9999"
                                value={courtForm.phone}
                                onChange={e => setCourtForm({...courtForm, phone: e.target.value})}
                            />
                        </div>
                     </form>
                </div>
            )}

            {/* STEP 3: MATCH DETAILS */}
            {step === 'match_details' && (
                <form id="match-form" onSubmit={handleSaveMatch} className="p-6 space-y-6 pb-8">
                    
                    {/* Court Info Banner */}
                    <div className="bg-pitch-800/50 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-pitch-400 uppercase font-bold">Local Definido</p>
                            <p className="text-white font-bold">{selectedCourt?.name}</p>
                        </div>
                        <button type="button" onClick={() => setStep('select_court')} className="text-xs text-neon hover:underline">Alterar</button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 items-start">
                        {/* HOME TEAM */}
                        <div className="text-center">
                            <label className="block text-pitch-300 text-xs font-bold mb-2 uppercase">Meu Time</label>
                            <div className="bg-pitch-800 p-3 rounded-lg text-white font-bold border border-pitch-700 truncate mb-3">
                                {currentUser.name}
                            </div>
                            <input 
                                type="number" 
                                className="w-20 mx-auto bg-black border-2 border-pitch-600 rounded-xl p-3 text-center text-3xl font-display font-bold text-white focus:border-neon focus:outline-none" 
                                value={homeScore}
                                onChange={(e) => setHomeScore(e.target.value)}
                                min="0"
                                placeholder="-"
                            />
                        </div>

                        {/* AWAY TEAM */}
                        <div className="text-center">
                            <label className="block text-pitch-300 text-xs font-bold mb-2 uppercase">Adversário</label>
                            <select 
                                value={selectedOpponentId}
                                onChange={(e) => setSelectedOpponentId(e.target.value)}
                                className="w-full bg-pitch-800 p-3 rounded-lg text-white font-bold border border-pitch-700 mb-3 focus:outline-none focus:border-neon text-sm appearance-none truncate"
                            >
                                <option value="">Selecione...</option>
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <input 
                                type="number" 
                                className="w-20 mx-auto bg-black border-2 border-pitch-600 rounded-xl p-3 text-center text-3xl font-display font-bold text-white focus:border-neon focus:outline-none" 
                                value={awayScore}
                                onChange={(e) => setAwayScore(e.target.value)}
                                min="0"
                                placeholder="-"
                            />
                        </div>
                    </div>

                    <div className="flex justify-center items-center -mt-2">
                        <span className="text-pitch-600 font-display text-4xl font-bold italic">VS</span>
                    </div>

                </form>
            )}
        </div>

        {/* Footer Actions (Fixed at Bottom) */}
        <div className="p-4 border-t border-pitch-800 bg-pitch-950 flex-shrink-0 z-10">
             {step === 'select_court' && (
                 <button onClick={onClose} className="w-full bg-transparent text-gray-500 font-bold py-3 text-sm">Cancelar</button>
             )}

             {step === 'register_court' && (
                 <div className="flex gap-3">
                     <button 
                        type="button"
                        onClick={() => setStep('select_court')}
                        className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20"
                     >
                        Voltar
                     </button>
                     <button 
                        type="submit"
                        form="court-form"
                        disabled={isSaving}
                        className="flex-1 bg-neon text-pitch-950 font-bold py-3 rounded-xl hover:bg-green-400"
                     >
                        {isSaving ? 'Salvando...' : 'Confirmar Cadastro'}
                     </button>
                 </div>
             )}

             {step === 'match_details' && (
                <div className="flex gap-3">
                     <button 
                        type="button"
                        onClick={() => setStep('select_court')}
                        className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20"
                     >
                        Voltar
                     </button>
                    <button 
                        type="submit"
                        form="match-form"
                        disabled={isSaving}
                        className="flex-[2] bg-neon text-pitch-950 font-bold py-3 rounded-xl hover:bg-green-400 shadow-lg shadow-neon/20 uppercase tracking-widest text-lg flex justify-center"
                    >
                        {isSaving ? 'Processando...' : 'Finalizar Jogo'}
                    </button>
                </div>
             )}
        </div>

      </div>
    </div>
  );
};