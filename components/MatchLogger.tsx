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
        html: `<div class="w-8 h-8 text-3xl drop-shadow-md animate-bounce">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });

    // 1. Handle Map Clicks
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            onLocationSelect(lat, lng);
            map.flyTo([lat, lng], 17, { animate: true }); // Zoom in on selection
        },
    });

    // 2. Handle External Updates (e.g. from CEP search)
    useEffect(() => {
        if (forcedPosition) {
            const newPos: [number, number] = [forcedPosition.lat, forcedPosition.lng];
            setPosition(newPos);
            map.flyTo(newPos, 17, { animate: true });
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

  // 1. Map Click Handler (Reverse Geocoding)
  const handleMapClick = async (lat: number, lng: number) => {
      setNewCourtCoords({ lat, lng });
      setIsLoadingCep(true);

      try {
          // Fetch address from coordinates
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();

          if (data && data.address) {
              const addr = data.address;
              
              // Construct Address String
              const street = addr.road || addr.pedestrian || '';
              const district = addr.suburb || addr.neighbourhood || addr.city_district || '';
              const city = addr.city || addr.town || addr.village || '';
              const state = addr.state_district || addr.state || '';
              
              const fullAddress = `${street}${district ? `, ${district}` : ''} - ${city}/${state}`;

              setCourtForm(prev => ({
                  ...prev,
                  cep: addr.postcode || prev.cep, // Update CEP if found
                  address: fullAddress,
                  number: addr.house_number || '' // Update number if found
              }));
          }
      } catch (error) {
          console.error("Reverse geocoding failed", error);
      } finally {
          setIsLoadingCep(false);
      }
  };

  // 2. CEP Blur Handler (Forward Geocoding)
  const handleCepBlur = async () => {
      const rawCep = courtForm.cep.replace(/\D/g, '');
      
      if (rawCep.length === 8) {
          setIsLoadingCep(true);
          try {
              // Get Address Data from ViaCEP
              const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
              const data = await response.json();
              
              if (!data.erro) {
                  const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}, Brasil`;
                  
                  setCourtForm(prev => ({
                      ...prev,
                      address: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
                  }));

                  // Geocode to get Lat/Lng for the Map
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
    // Z-INDEX UPDATE: Increased to z-[2000] to be well above Navigation (z-100)
    <div className="fixed inset-0 bg-black/95 z-[2000] flex items-center justify-center p-0 md:p-4 animate-[fadeIn_0.2s_ease-out]">
      
      {/* MOBILE FULL SCREEN LAYOUT: h-full w-full on mobile, rounded card on desktop */}
      <div className="bg-pitch-950 md:border md:border-neon/30 md:rounded-2xl w-full h-full md:h-[90vh] md:max-w-2xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header - Fixed Height */}
        <div className="h-16 px-4 md:px-6 border-b border-pitch-800 flex justify-between items-center bg-pitch-950 flex-shrink-0 z-50">
          <div className="flex flex-col">
              <span className="text-[10px] text-neon font-bold uppercase tracking-widest">
                  {step === 'select_court' && 'Passo 1/2'}
                  {step === 'register_court' && 'Novo Local'}
                  {step === 'match_details' && 'Súmula Oficial'}
              </span>
              <h2 className="text-lg font-display font-bold text-white uppercase leading-none">
                  {step === 'select_court' && 'Definir Local'}
                  {step === 'register_court' && 'Cadastrar Quadra'}
                  {step === 'match_details' && 'Detalhes do Jogo'}
              </h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 active:scale-90 transition-all">
              <span className="text-xl text-white font-bold">✕</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-pitch-900/50 relative">
            
            {/* STEP 1: SELECT COURT */}
            {step === 'select_court' && (
                <div className="p-4 space-y-4">
                    {/* Add Court Button (Owner Only) */}
                    {currentUser.role === UserRole.OWNER && (
                        <button 
                            onClick={() => setStep('register_court')}
                            className="w-full bg-gradient-to-r from-pitch-900 to-black border border-dashed border-pitch-600 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-neon transition-all group active:scale-[0.98]"
                        >
                            <div className="w-12 h-12 rounded-full bg-pitch-800 flex items-center justify-center border border-pitch-600 group-hover:border-neon group-hover:text-neon transition-colors">
                                <span className="text-2xl text-pitch-400 group-hover:text-neon">+</span>
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-white text-lg">Cadastrar Nova Quadra</span>
                                <span className="text-xs text-gray-500">O local não aparece na lista abaixo?</span>
                            </div>
                        </button>
                    )}

                    <div className="space-y-3 pb-8">
                        <div className="sticky top-0 bg-pitch-900/95 backdrop-blur py-2 z-10 border-b border-white/5">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Quadras Próximas</p>
                        </div>
                        
                        {sortedCourts.length === 0 ? (
                            <div className="text-center py-12 text-gray-600">
                                <span className="text-3xl block mb-2 opacity-30">🏟️</span>
                                <p>Nenhuma quadra encontrada.</p>
                            </div>
                        ) : (
                            sortedCourts.map(court => (
                                <button
                                    key={court.id}
                                    onClick={() => {
                                        setSelectedCourt(court);
                                        setStep('match_details');
                                    }}
                                    className="w-full bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 hover:border-neon/30 transition-all text-left active:bg-white/20"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-pitch-800 flex items-center justify-center text-xl">🏟️</div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{court.name}</h4>
                                            <p className="text-xs text-gray-400 truncate max-w-[200px]">{court.address}, {court.number}</p>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* STEP 2: REGISTER COURT (Owner Only) */}
            {step === 'register_court' && (
                <div className="flex flex-col h-full">
                     {/* Map Container - Flexible height on mobile */}
                     <div className="h-[40vh] md:h-[300px] w-full relative flex-shrink-0 border-b-4 border-neon/20 shadow-lg">
                         <MapContainer 
                            center={userLocation ? [userLocation.lat, userLocation.lng] : [40.7128, -74.0060]} 
                            zoom={16} 
                            style={{ height: "100%", width: "100%" }}
                            zoomControl={false}
                        >
                             <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                            {/* Controller passes click events back to parent */}
                            <LocationController 
                                forcedPosition={newCourtCoords}
                                onLocationSelect={handleMapClick} 
                            />
                         </MapContainer>
                         
                         {/* Floating Helper UI */}
                         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-max max-w-[90%] z-[1000] pointer-events-none">
                             <div className={`px-4 py-2 rounded-full backdrop-blur-md border shadow-lg text-xs font-bold transition-all text-center flex items-center gap-2 ${
                                 isLoadingCep ? 'bg-black/80 border-neon text-neon' : 
                                 newCourtCoords ? 'bg-green-900/90 border-green-500 text-white' : 
                                 'bg-black/60 border-white/20 text-white'
                             }`}>
                                 {isLoadingCep ? (
                                     <><div className="w-3 h-3 border-2 border-neon border-t-transparent rounded-full animate-spin"></div> Buscando endereço...</>
                                 ) : newCourtCoords ? (
                                     <>✅ Local definido. Preencha os detalhes.</>
                                 ) : (
                                     <>👇 Toque no mapa para marcar a quadra</>
                                 )}
                             </div>
                         </div>
                     </div>
                     
                     <form id="court-form" onSubmit={handleRegisterCourt} className="p-5 space-y-5 pb-24 bg-gradient-to-b from-pitch-900 to-pitch-950 flex-1">
                        <div>
                            <label className="block text-neon text-[10px] font-bold uppercase mb-1 tracking-wider">Nome do Local</label>
                            <input 
                                required
                                type="text" 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon focus:outline-none placeholder-gray-600 font-bold"
                                placeholder="Ex: Arena Real"
                                value={courtForm.name}
                                onChange={e => setCourtForm({...courtForm, name: e.target.value})}
                            />
                        </div>
                        
                        <div className="grid grid-cols-[1.5fr_1fr] gap-4">
                             <div>
                                <label className="block text-gray-400 text-[10px] font-bold uppercase mb-1">CEP</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon focus:outline-none placeholder-gray-600"
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
                                        <div className="absolute right-3 top-4 w-4 h-4 border-2 border-neon border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                </div>
                             </div>
                             <div>
                                <label className="block text-gray-400 text-[10px] font-bold uppercase mb-1">Número</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon focus:outline-none placeholder-gray-600"
                                    placeholder="123"
                                    value={courtForm.number}
                                    onChange={e => setCourtForm({...courtForm, number: e.target.value})}
                                />
                             </div>
                        </div>

                        <div>
                            <label className="block text-gray-400 text-[10px] font-bold uppercase mb-1">Endereço (Rua/Av/Bairro)</label>
                            <input 
                                required
                                type="text" 
                                className={`w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon focus:outline-none placeholder-gray-600 transition-opacity ${isLoadingCep ? 'opacity-50' : ''}`}
                                placeholder="Rua das Palmeiras..."
                                value={courtForm.address}
                                onChange={e => setCourtForm({...courtForm, address: e.target.value})}
                                readOnly={isLoadingCep}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-[10px] font-bold uppercase mb-1">Telefone da Quadra (Opcional)</label>
                            <input 
                                type="tel" 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon focus:outline-none placeholder-gray-600"
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
                <form id="match-form" onSubmit={handleSaveMatch} className="p-6 space-y-8 pb-8">
                    
                    {/* Court Info Banner */}
                    <div className="bg-gradient-to-r from-pitch-900 to-black p-4 rounded-xl border border-neon/20 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-pitch-800 rounded-lg flex items-center justify-center text-lg">📍</div>
                            <div>
                                <p className="text-[10px] text-neon uppercase font-bold tracking-wider">Local Definido</p>
                                <p className="text-white font-bold text-lg leading-tight">{selectedCourt?.name}</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setStep('select_court')} className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg transition-colors">
                            ✏️
                        </button>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                        {/* HOME TEAM */}
                        <div className="flex-1 flex flex-col items-center gap-3">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Seu Time</span>
                            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-gray-700 to-black shadow-lg">
                                {/* Placeholder for user team logo if available */}
                                <div className="w-full h-full rounded-full bg-pitch-800 flex items-center justify-center font-display font-bold text-2xl text-white">
                                    {currentUser.name.charAt(0)}
                                </div>
                            </div>
                            <div className="text-center w-full">
                                <p className="text-white font-bold text-sm truncate w-full">{currentUser.name}</p>
                            </div>
                            <input 
                                type="number" 
                                className="w-20 h-16 bg-black border-2 border-pitch-600 rounded-xl text-center text-4xl font-display font-bold text-neon focus:border-neon focus:outline-none shadow-inner" 
                                value={homeScore}
                                onChange={(e) => setHomeScore(e.target.value)}
                                min="0"
                                placeholder="0"
                            />
                        </div>

                        {/* VS */}
                        <div className="self-center pt-8">
                            <span className="text-pitch-600 font-display text-5xl font-bold italic opacity-50">VS</span>
                        </div>

                        {/* AWAY TEAM */}
                        <div className="flex-1 flex flex-col items-center gap-3">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Adversário</span>
                            
                            {/* Opponent Selector with visual feedback */}
                            <div className="relative w-20 h-20">
                                <select 
                                    value={selectedOpponentId}
                                    onChange={(e) => setSelectedOpponentId(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                >
                                    <option value="">Selecione...</option>
                                    {teams.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <div className={`w-full h-full rounded-full p-1 shadow-lg transition-all ${selectedOpponentId ? 'bg-gradient-to-b from-red-800 to-black' : 'bg-dashed border-2 border-gray-700 bg-gray-900'}`}>
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                        {selectedOpponentId ? (
                                            <img src={teams.find(t => t.id === selectedOpponentId)?.logoUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl text-gray-600">+</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center w-full min-h-[20px]">
                                {selectedOpponentId ? (
                                    <p className="text-white font-bold text-sm truncate w-full">{teams.find(t => t.id === selectedOpponentId)?.name}</p>
                                ) : (
                                    <p className="text-gray-500 text-xs italic">Toque para escolher</p>
                                )}
                            </div>

                            <input 
                                type="number" 
                                className="w-20 h-16 bg-black border-2 border-pitch-600 rounded-xl text-center text-4xl font-display font-bold text-red-500 focus:border-red-500 focus:outline-none shadow-inner" 
                                value={awayScore}
                                onChange={(e) => setAwayScore(e.target.value)}
                                min="0"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </form>
            )}
        </div>

        {/* Footer Actions - Always Visible at Bottom */}
        <div className="p-4 md:p-6 border-t border-pitch-800 bg-pitch-950 flex-shrink-0 z-50">
             {step === 'select_court' && (
                 <button onClick={onClose} className="w-full bg-transparent text-gray-500 font-bold py-4 text-sm hover:text-white transition-colors">Cancelar Operação</button>
             )}

             {step === 'register_court' && (
                 <div className="flex gap-3">
                     <button 
                        type="button"
                        onClick={() => setStep('select_court')}
                        className="w-14 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 flex items-center justify-center"
                     >
                        ←
                     </button>
                     <button 
                        type="submit"
                        form="court-form"
                        disabled={isSaving}
                        className="flex-1 bg-neon text-pitch-950 font-bold py-4 rounded-xl hover:bg-green-400 shadow-lg shadow-neon/20 uppercase tracking-widest text-sm"
                     >
                        {isSaving ? 'Salvando...' : 'Confirmar Local'}
                     </button>
                 </div>
             )}

             {step === 'match_details' && (
                <div className="flex gap-3">
                     <button 
                        type="button"
                        onClick={() => setStep('select_court')}
                        className="w-14 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 flex items-center justify-center"
                     >
                        ←
                     </button>
                    <button 
                        type="submit"
                        form="match-form"
                        disabled={isSaving}
                        className="flex-1 bg-gradient-to-r from-neon to-green-500 text-pitch-950 font-display font-bold text-xl py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(57,255,20,0.4)] uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            'Processando...'
                        ) : (
                            <><span>📢</span> Publicar Resultado</>
                        )}
                    </button>
                </div>
             )}
        </div>

      </div>
    </div>
  );
};