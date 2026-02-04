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
  const [teams, setTeams] = useState<Team[]>([]);
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
          setTeams(fetchedTeams.filter(t => t.id !== userTeamId)); // Filter out own team
          
          const myTeam = fetchedTeams.find(t => t.id === userTeamId);
          if (myTeam) setMyPlayers(myTeam.players);

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

  // Handle Goal Addition
  const addGoal = (playerId: string, playerName: string) => {
      setGoals(prev => [...prev, { playerId, playerName, teamId: userTeamId }]);
      // Auto increment home score as visual feedback? No, let user control score manually to allow opponent goals.
  };

  const removeGoal = (index: number) => {
      setGoals(prev => prev.filter((_, i) => i !== index));
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
        const opponentTeam = teams.find(t => t.id === selectedOpponentId);
        
        const finalDate = matchMode === 'schedule' ? new Date(scheduleDate) : new Date();
        const status: MatchStatus = matchMode === 'schedule' ? 'SCHEDULED' : 'FINISHED';

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
            alert(matchMode === 'schedule' ? "Jogo agendado com sucesso! Envie o convite ao adversário." : "Jogo registrado com sucesso!");
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

            {/* STEP 2: REGISTER COURT (Same as before, abbreviated) */}
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

            {/* STEP 3: MATCH DETAILS - REFACTORED */}
            {step === 'match_details' && (
                <div className="p-6 space-y-6 pb-20">
                    
                    {/* Mode Switcher */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                        <button 
                            onClick={() => setMatchMode('schedule')}
                            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${matchMode === 'schedule' ? 'bg-neon text-black shadow-neon' : 'text-gray-400 hover:text-white'}`}
                        >
                            📅 Agendar Futuro
                        </button>
                        <button 
                            onClick={() => setMatchMode('finish')}
                            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${matchMode === 'finish' ? 'bg-neon text-black shadow-neon' : 'text-gray-400 hover:text-white'}`}
                        >
                            ✅ Registrar Placar
                        </button>
                    </div>

                    {/* Court Info */}
                    <div className="bg-gradient-to-r from-pitch-900 to-black p-4 rounded-xl border border-neon/20 flex items-center justify-between shadow-lg">
                        <div>
                            <p className="text-[10px] text-neon uppercase font-bold tracking-wider">Local Definido</p>
                            <p className="text-white font-bold text-lg leading-tight">{selectedCourt?.name}</p>
                        </div>
                        <button type="button" onClick={() => setStep('select_court')} className="bg-white/5 p-2 rounded-lg text-white">✏️</button>
                    </div>

                    {/* Matchup Inputs */}
                    <div className="flex items-center justify-between gap-2">
                         {/* My Team */}
                         <div className="flex flex-col items-center gap-2">
                             <div className="w-16 h-16 rounded-full bg-pitch-800 flex items-center justify-center font-display text-2xl text-white font-bold border-2 border-neon">{currentUser.name.charAt(0)}</div>
                             <span className="text-xs font-bold text-white max-w-[80px] truncate">{currentUser.name}</span>
                             {matchMode === 'finish' && (
                                <input type="number" placeholder="0" className="w-16 h-12 bg-black border border-pitch-600 rounded-lg text-center text-2xl font-display font-bold text-neon" value={homeScore} onChange={e => setHomeScore(e.target.value)} />
                             )}
                         </div>

                         <span className="text-gray-600 font-display text-4xl italic">VS</span>

                         {/* Opponent */}
                         <div className="flex flex-col items-center gap-2 relative">
                             <select className="absolute inset-0 opacity-0 z-10 w-full h-full cursor-pointer" value={selectedOpponentId} onChange={e => setSelectedOpponentId(e.target.value)}>
                                 <option value="">Selecione...</option>
                                 {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                             </select>
                             <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 overflow-hidden ${selectedOpponentId ? 'border-red-500' : 'border-gray-600 border-dashed bg-white/5'}`}>
                                 {selectedOpponentId ? (
                                     <img src={teams.find(t => t.id === selectedOpponentId)?.logoUrl} className="w-full h-full object-cover" />
                                 ) : (
                                     <span className="text-2xl text-gray-500">+</span>
                                 )}
                             </div>
                             <span className="text-xs font-bold text-white max-w-[80px] truncate min-h-[16px]">{teams.find(t => t.id === selectedOpponentId)?.name || 'Adversário'}</span>
                             {matchMode === 'finish' && (
                                <input type="number" placeholder="0" className="w-16 h-12 bg-black border border-pitch-600 rounded-lg text-center text-2xl font-display font-bold text-red-500" value={awayScore} onChange={e => setAwayScore(e.target.value)} />
                             )}
                         </div>
                    </div>

                    {/* Conditional Fields */}
                    {matchMode === 'schedule' ? (
                        <div className="animate-fadeIn">
                             <label className="text-gray-400 text-[10px] font-bold uppercase mb-1 block">Data e Horário do Jogo</label>
                             <input 
                                type="datetime-local" 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-lg font-bold focus:border-neon"
                                value={scheduleDate}
                                onChange={e => setScheduleDate(e.target.value)}
                             />
                             <p className="text-xs text-gray-500 mt-2 text-center">O placar será definido após a partida pelos capitães.</p>
                        </div>
                    ) : (
                        <div className="animate-fadeIn bg-white/5 p-4 rounded-xl border border-white/5">
                             <h4 className="text-neon text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                ⚽ Quem fez os gols?
                             </h4>
                             {/* Scorer Selector */}
                             <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
                                 {myPlayers.map(p => (
                                     <button 
                                        key={p.id}
                                        type="button"
                                        onClick={() => addGoal(p.id, p.name)}
                                        className="flex-shrink-0 flex flex-col items-center gap-1 group"
                                     >
                                         <img src={p.avatarUrl} className="w-10 h-10 rounded-full border border-gray-600 group-hover:border-neon transition-colors" />
                                         <span className="text-[9px] text-gray-400 truncate w-12 text-center">{p.name}</span>
                                     </button>
                                 ))}
                             </div>
                             
                             {/* Goals List */}
                             <div className="space-y-1">
                                 {goals.map((g, idx) => (
                                     <div key={idx} className="flex justify-between items-center bg-black/30 p-2 rounded border border-white/5">
                                         <div className="flex items-center gap-2">
                                             <span className="text-lg">⚽</span>
                                             <span className="text-sm font-bold text-white">{g.playerName}</span>
                                         </div>
                                         <button onClick={() => removeGoal(idx)} className="text-red-500 text-xs font-bold px-2">Remover</button>
                                     </div>
                                 ))}
                                 {goals.length === 0 && <p className="text-xs text-gray-600 italic text-center">Nenhum gol registrado.</p>}
                             </div>
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
                        {isSaving ? 'Processando...' : (matchMode === 'schedule' ? '📅 Confirmar Agendamento' : '📢 Publicar Resultado')}
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