import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { dbService } from '../services/database';
import { Match, User, Court, Team, UserRole, MatchGoal, MatchStatus } from '../types';

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
  const [step, setStep] = useState<'select_court' | 'register_court' | 'match_details'>('select_court');
  
  // Data State
  const [courts, setCourts] = useState<Court[]>([]);
  const [opponents, setOpponents] = useState<Team[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [myPlayers, setMyPlayers] = useState<User[]>([]);

  // Form State - Match
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>('');
  const [matchMode, setMatchMode] = useState<'schedule' | 'finish'>('schedule');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [goals, setGoals] = useState<MatchGoal[]>([]);
  
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
          
          // Separate My Team and Opponents
          const myTeamData = fetchedTeams.find(t => t.id === userTeamId);
          const opps = fetchedTeams.filter(t => t.id !== userTeamId);
          
          setMyTeam(myTeamData || null);
          setOpponents(opps);
          
          if (myTeamData) setMyPlayers(myTeamData.players);

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
  }, [userTeamId]);

  // Sort courts by distance
  const sortedCourts = React.useMemo(() => {
      if (!userLocation) return courts;
      return [...courts].sort((a, b) => {
          const distA = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, a.lat, a.lng);
          const distB = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
          return distA - distB;
      });
  }, [courts, userLocation]);

  // Handle Goal Addition
  const addGoal = (playerId: string, playerName: string) => {
      setGoals(prev => [...prev, { playerId, playerName, teamId: userTeamId }]);
      // Auto-increment score for convenience
      const currentScore = parseInt(homeScore) || 0;
      setHomeScore((currentScore + 1).toString());
  };

  const removeGoal = (index: number) => {
      setGoals(prev => prev.filter((_, i) => i !== index));
      // Auto-decrement score
      const currentScore = parseInt(homeScore) || 0;
      if (currentScore > 0) setHomeScore((currentScore - 1).toString());
  };


  // --- HANDLERS ---

  // 1. Map Click Handler (Reverse Geocoding)
  const handleMapClick = async (lat: number, lng: number) => {
      setNewCourtCoords({ lat, lng });
      setIsLoadingCep(true);

      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();

          if (data && data.address) {
              const addr = data.address;
              const street = addr.road || addr.pedestrian || '';
              const district = addr.suburb || addr.neighbourhood || addr.city_district || '';
              const city = addr.city || addr.town || addr.village || '';
              const state = addr.state_district || addr.state || '';
              
              const fullAddress = `${street}${district ? `, ${district}` : ''} - ${city}/${state}`;

              setCourtForm(prev => ({
                  ...prev,
                  cep: addr.postcode || prev.cep, 
                  address: fullAddress,
                  number: addr.house_number || '' 
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
              const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
              const data = await response.json();
              if (!data.erro) {
                  const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}, Brasil`;
                  setCourtForm(prev => ({
                      ...prev,
                      address: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
                  }));
                  try {
                      const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`);
                      const geoData = await geoResponse.json();
                      if (geoData && geoData.length > 0) {
                          setNewCourtCoords({ lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) });
                      }
                  } catch (geoError) {}
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
          alert("Por favor, confirme a localização no mapa.");
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
    if(!selectedCourt) { alert("Erro: Nenhuma quadra selecionada."); return; }
    if (!selectedOpponentId) { alert("Selecione o time adversário."); return; }

    // Validation per mode
    if (matchMode === 'schedule') {
        if (!scheduleDate) { alert("Defina data e hora para agendar."); return; }
    } else {
        if (homeScore === '' || awayScore === '') { alert("Preencha o placar."); return; }
    }

    setIsSaving(true);

    try {
        const opponentTeam = opponents.find(t => t.id === selectedOpponentId);
        
        const finalDate = matchMode === 'schedule' ? new Date(scheduleDate) : new Date();
        const status: MatchStatus = matchMode === 'schedule' ? 'PENDING' : 'FINISHED';

        const newMatch: Match = {
            id: `m-${Date.now()}`,
            date: finalDate,
            locationName: selectedCourt.name,
            courtId: selectedCourt.id,
            homeTeamId: userTeamId,
            awayTeamName: opponentTeam?.name || "Desconhecido",
            awayTeamId: selectedOpponentId,
            homeScore: matchMode === 'finish' ? Number(homeScore) : undefined,
            awayScore: matchMode === 'finish' ? Number(awayScore) : undefined,
            isVerified: true,
            status: status,
            goals: matchMode === 'finish' ? goals : []
        };

        const success = await dbService.createMatch(newMatch);
        
        if (success) {
            alert(matchMode === 'schedule' ? "Convite enviado para o dono do time adversário!" : "Jogo registrado com sucesso!");
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
    <div className="fixed inset-0 bg-black/95 z-[2000] flex items-center justify-center p-0 md:p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-pitch-950 md:border md:border-neon/30 md:rounded-2xl w-full h-full md:h-[90vh] md:max-w-2xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="h-16 px-4 md:px-6 border-b border-pitch-800 flex justify-between items-center bg-pitch-950 flex-shrink-0 z-50">
          <div className="flex flex-col">
              <span className="text-[10px] text-neon font-bold uppercase tracking-widest">
                  {step === 'select_court' && 'Passo 1/2'}
                  {step === 'match_details' && 'Súmula Oficial'}
              </span>
              <h2 className="text-lg font-display font-bold text-white uppercase leading-none">
                  {step === 'select_court' && 'Definir Local'}
                  {step === 'register_court' && 'Nova Quadra'}
                  {step === 'match_details' && 'Detalhes do Jogo'}
              </h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 active:scale-90 transition-all">
              <span className="text-xl text-white font-bold">✕</span>
          </button>
        </div>

        {/* Scrollable Content */}
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
                            <span className="text-2xl text-pitch-400 group-hover:text-neon">+</span>
                            <span className="block font-bold text-white text-lg">Cadastrar Nova Quadra</span>
                        </button>
                    )}

                    <div className="space-y-3 pb-8">
                        {sortedCourts.map(court => (
                            <button
                                key={court.id}
                                onClick={() => { setSelectedCourt(court); setStep('match_details'); }}
                                className="w-full bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 text-left active:bg-white/20"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-pitch-800 flex items-center justify-center text-xl">🏟️</div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{court.name}</h4>
                                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{court.address}</p>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* STEP 2: REGISTER COURT */}
            {step === 'register_court' && (
                <div className="flex flex-col h-full">
                     <div className="h-[40vh] md:h-[300px] w-full relative flex-shrink-0 border-b-4 border-neon/20">
                         <MapContainer center={[userLocation?.lat || -23.55, userLocation?.lng || -46.63]} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                             <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                             <LocationController forcedPosition={newCourtCoords} onLocationSelect={handleMapClick} />
                         </MapContainer>
                     </div>
                     <form id="court-form" onSubmit={handleRegisterCourt} className="p-5 space-y-5 flex-1 bg-gradient-to-b from-pitch-900 to-pitch-950">
                        <div>
                            <label className="text-neon text-[10px] font-bold uppercase">Nome</label>
                            <input required type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white" value={courtForm.name} onChange={e => setCourtForm({...courtForm, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-[1.5fr_1fr] gap-4">
                            <div><label className="text-gray-400 text-[10px] font-bold uppercase">CEP</label><input required type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white" value={courtForm.cep} onChange={e => setCourtForm({...courtForm, cep: e.target.value})} onBlur={handleCepBlur} /></div>
                            <div><label className="text-gray-400 text-[10px] font-bold uppercase">Nº</label><input required type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white" value={courtForm.number} onChange={e => setCourtForm({...courtForm, number: e.target.value})} /></div>
                        </div>
                        <div><label className="text-gray-400 text-[10px] font-bold uppercase">Endereço</label><input required type="text" readOnly className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white opacity-70" value={courtForm.address} /></div>
                     </form>
                </div>
            )}

            {/* STEP 3: MATCH DETAILS */}
            {step === 'match_details' && (
                <div className="p-6 space-y-6 pb-20">
                    
                    {/* Court Info */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1">
                            📍 {selectedCourt?.name}
                        </span>
                        <button type="button" onClick={() => setStep('select_court')} className="text-neon text-[10px] font-bold uppercase underline">Alterar</button>
                    </div>

                    {/* --- PROFESSIONAL BROADCAST HEADER --- */}
                    <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
                        {/* Background Effect */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon via-white to-red-500 opacity-50"></div>
                        <div className="absolute -inset-10 bg-gradient-to-r from-neon/10 to-red-500/10 blur-[50px] pointer-events-none"></div>

                        <div className="flex items-center justify-between relative z-10">
                            
                            {/* MY TEAM (HOME) */}
                            <div className="flex flex-col items-center w-1/3">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black border-2 border-neon p-1 shadow-[0_0_15px_rgba(57,255,20,0.3)] mb-2">
                                    <img src={myTeam?.logoUrl || currentUser.avatarUrl} className="w-full h-full rounded-full object-cover" />
                                </div>
                                <h3 className="text-white font-display font-bold text-lg md:text-xl text-center leading-none uppercase tracking-wide">
                                    {myTeam?.name || "Meu Time"}
                                </h3>
                                <span className="text-[9px] bg-neon/20 text-neon px-2 py-0.5 rounded uppercase font-bold mt-1">Mandante</span>
                            </div>

                            {/* VS / SCORE */}
                            <div className="flex flex-col items-center justify-center w-1/3">
                                {matchMode === 'finish' ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            className="w-12 h-14 bg-black/50 border border-white/20 rounded-lg text-3xl font-display font-bold text-neon text-center focus:outline-none focus:border-neon"
                                            value={homeScore}
                                            onChange={e => setHomeScore(e.target.value)}
                                            placeholder="0"
                                        />
                                        <span className="text-gray-500 font-bold text-xl">-</span>
                                        <input 
                                            type="number" 
                                            className="w-12 h-14 bg-black/50 border border-white/20 rounded-lg text-3xl font-display font-bold text-red-500 text-center focus:outline-none focus:border-red-500"
                                            value={awayScore}
                                            onChange={e => setAwayScore(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-4xl font-display font-bold text-gray-600 italic">VS</div>
                                )}
                            </div>

                            {/* OPPONENT (AWAY) */}
                            <div className="flex flex-col items-center w-1/3 relative">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black border-2 border-red-500 p-1 shadow-[0_0_15px_rgba(239,68,68,0.3)] mb-2 relative group cursor-pointer overflow-hidden">
                                     <select 
                                        className="absolute inset-0 opacity-0 z-20 cursor-pointer"
                                        value={selectedOpponentId}
                                        onChange={e => setSelectedOpponentId(e.target.value)}
                                     >
                                        <option value="">Selecione...</option>
                                        {opponents.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                     </select>
                                     
                                     {selectedOpponentId ? (
                                         <img src={opponents.find(t => t.id === selectedOpponentId)?.logoUrl} className="w-full h-full rounded-full object-cover" />
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center bg-white/5 text-gray-500 font-bold text-2xl group-hover:text-white transition-colors">?</div>
                                     )}
                                     
                                     {/* Overlay hint */}
                                     {!selectedOpponentId && <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] uppercase font-bold text-center">Selecionar</div>}
                                </div>
                                <h3 className="text-white font-display font-bold text-lg md:text-xl text-center leading-none uppercase tracking-wide">
                                    {opponents.find(t => t.id === selectedOpponentId)?.name || "Adversário"}
                                </h3>
                                <span className="text-[9px] bg-red-900/20 text-red-500 px-2 py-0.5 rounded uppercase font-bold mt-1">Visitante</span>
                            </div>

                        </div>
                    </div>
                    {/* --- END HEADER --- */}

                    {/* Mode Switcher */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                        <button 
                            onClick={() => setMatchMode('schedule')}
                            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${matchMode === 'schedule' ? 'bg-neon text-black shadow-neon' : 'text-gray-400 hover:text-white'}`}
                        >
                            📅 Agendar
                        </button>
                        <button 
                            onClick={() => setMatchMode('finish')}
                            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${matchMode === 'finish' ? 'bg-neon text-black shadow-neon' : 'text-gray-400 hover:text-white'}`}
                        >
                            ✅ Placar Final
                        </button>
                    </div>

                    {/* Conditional Fields */}
                    {matchMode === 'schedule' ? (
                        <div className="animate-fadeIn">
                             <label className="text-gray-400 text-[10px] font-bold uppercase mb-1 block">Data e Horário</label>
                             <input 
                                type="datetime-local" 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-lg font-bold focus:border-neon"
                                value={scheduleDate}
                                onChange={e => setScheduleDate(e.target.value)}
                             />
                        </div>
                    ) : (
                        <div className="animate-fadeIn space-y-4">
                             {/* GOAL SCORER SELECTION */}
                             <div>
                                 <h4 className="text-neon text-xs font-bold uppercase mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                                    <span>⚽</span> Registrar Gols (Meu Time)
                                 </h4>
                                 
                                 {/* Player List Horizontal Scroll */}
                                 <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                                     {myPlayers.map(p => (
                                         <button 
                                            key={p.id}
                                            type="button"
                                            onClick={() => addGoal(p.id, p.name)}
                                            className="flex-shrink-0 flex flex-col items-center gap-2 group min-w-[70px]"
                                         >
                                             <div className="relative">
                                                 <img src={p.avatarUrl} className="w-12 h-12 rounded-full border border-gray-600 group-hover:border-neon group-active:scale-95 transition-all object-cover bg-gray-800" />
                                                 {p.shirtNumber && (
                                                     <div className="absolute -bottom-2 -right-1 w-6 h-6 bg-black border border-neon rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                                                         {p.shirtNumber}
                                                     </div>
                                                 )}
                                             </div>
                                             <span className="text-[10px] text-gray-400 font-bold truncate w-full text-center group-hover:text-white">{p.name.split(' ')[0]}</span>
                                         </button>
                                     ))}
                                     {myPlayers.length === 0 && <p className="text-xs text-gray-500 italic">Adicione jogadores ao elenco para registrar gols.</p>}
                                 </div>
                             </div>
                             
                             {/* Goals Summary Log */}
                             {goals.length > 0 && (
                                 <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden">
                                     {goals.map((g, idx) => (
                                         <div key={idx} className="flex justify-between items-center p-3 border-b border-white/5 last:border-0 hover:bg-white/5">
                                             <div className="flex items-center gap-3">
                                                 <span className="text-neon font-display text-lg font-bold">#{idx + 1}</span>
                                                 <div>
                                                     <p className="text-xs font-bold text-white uppercase">{g.playerName}</p>
                                                     <p className="text-[9px] text-gray-500">Gol do Mandante</p>
                                                 </div>
                                             </div>
                                             <button onClick={() => removeGoal(idx)} className="text-red-500 hover:text-white bg-red-900/20 hover:bg-red-600 rounded p-1.5 transition-colors">
                                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-pitch-800 bg-pitch-950 flex gap-3 z-50">
            {step === 'match_details' ? (
                <>
                    <button onClick={() => setStep('select_court')} className="w-14 bg-white/10 text-white rounded-xl hover:bg-white/20">←</button>
                    <button 
                        onClick={handleSaveMatch}
                        disabled={isSaving}
                        className="flex-1 bg-neon text-black font-bold py-4 rounded-xl hover:scale-[1.02] shadow-neon uppercase tracking-wide"
                    >
                        {isSaving ? 'Processando...' : (matchMode === 'schedule' ? '📅 Enviar Convite' : '📢 Finalizar Jogo')}
                    </button>
                </>
            ) : (
                <button type="submit" form="court-form" className="w-full bg-neon text-black font-bold py-4 rounded-xl shadow-neon hidden">Hidden Submit</button>
            )}
             {/* Dynamic Buttons for step 1 & 2 are handled inside their blocks or by this footer generically if I restructure, but keeping logic consistent with previous file for simplicity */}
             {(step === 'register_court') && (
                 <>
                    <button onClick={() => setStep('select_court')} className="w-14 bg-white/10 text-white rounded-xl hover:bg-white/20">←</button>
                    <button type="submit" form="court-form" disabled={isSaving} className="flex-1 bg-neon text-black font-bold py-4 rounded-xl shadow-neon">Salvar Local</button>
                 </>
             )}
             {step === 'select_court' && (
                 <button onClick={onClose} className="w-full text-gray-500 py-4 font-bold">Cancelar</button>
             )}
        </div>

      </div>
    </div>
  );
};