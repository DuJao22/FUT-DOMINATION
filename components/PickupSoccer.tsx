import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { PickupGame, User, Court, UserRole } from '../types';
import { dbService } from '../services/database';

// Reuse location controller logic simplified
const LocationController = ({ onLocationSelect, forcedPosition }: { onLocationSelect: (lat: number, lng: number) => void, forcedPosition?: {lat: number, lng: number} | null }) => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const map = useMap();
    const selectionIcon = L.divIcon({
        className: 'selection-marker',
        html: `<div class="w-8 h-8 text-3xl drop-shadow-md animate-bounce">⚽</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });

    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            onLocationSelect(lat, lng);
            map.flyTo([lat, lng], 17, { animate: true });
        },
    });

    useEffect(() => {
        if (forcedPosition) {
            const newPos: [number, number] = [forcedPosition.lat, forcedPosition.lng];
            setPosition(newPos);
            map.flyTo(newPos, 17, { animate: true });
        }
    }, [forcedPosition, map]);

    useEffect(() => {
        if (!forcedPosition && !position) {
             map.locate().on("locationfound", function (e) {
                if (!position) map.flyTo(e.latlng, 14);
            });
        }
    }, [map]);

    return position ? <Marker position={position} icon={selectionIcon} /> : null;
};

interface PickupSoccerProps {
    currentUser: User;
    onViewPlayer?: (user: User) => void;
}

export const PickupSoccer: React.FC<PickupSoccerProps> = ({ currentUser, onViewPlayer }) => {
    const [activeTab, setActiveTab] = useState<'explore' | 'create'>('explore');
    const [games, setGames] = useState<PickupGame[]>([]);
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);

    // State for Viewing Location Modal
    const [viewingCourt, setViewingCourt] = useState<Court | null>(null);
    const [viewingAdHoc, setViewingAdHoc] = useState<{lat: number, lng: number, name: string} | null>(null);

    // State for Viewing Player List
    const [viewingAttendees, setViewingAttendees] = useState<User[] | null>(null);
    const [attendeesGameTitle, setAttendeesGameTitle] = useState('');

    // Create Form State
    const [formStep, setFormStep] = useState(1); // 1=Location, 2=Details
    const [newGameLocation, setNewGameLocation] = useState<{lat: number, lng: number} | null>(null);
    const [locationName, setLocationName] = useState('');
    const [gameTitle, setGameTitle] = useState('');
    const [gameDate, setGameDate] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(14);
    const [description, setDescription] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [fetchedGames, fetchedCourts] = await Promise.all([
            dbService.getPickupGames(),
            dbService.getCourts()
        ]);
        setGames(fetchedGames);
        setCourts(fetchedCourts);
        setLoading(false);
    };

    const handleJoin = async (game: PickupGame) => {
        if (game.confirmedPlayers.includes(currentUser.id)) {
            // Leave logic
            const success = await dbService.leavePickupGame(game.id, currentUser.id);
            if(success) loadData();
        } else {
            // Join logic
            if (game.confirmedPlayers.length >= game.maxPlayers) {
                alert("Jogo lotado!");
                return;
            }
            const res = await dbService.joinPickupGame(game.id, currentUser.id, game.date);
            if (res.success) {
                alert("Presença confirmada! Bom jogo.");
                loadData();
            } else {
                alert(res.message); // Will show error if > 2 games
            }
        }
    };

    const handleViewList = async (game: PickupGame) => {
        const users = await dbService.getUsersByIds(game.confirmedPlayers);
        setAttendeesGameTitle(game.title);
        setViewingAttendees(users);
    };

    const handleCreateGame = async () => {
        if (!newGameLocation || !gameTitle || !gameDate) return;
        
        const newGame: PickupGame = {
            id: `pickup-${Date.now()}`,
            hostId: currentUser.id,
            hostName: currentUser.name,
            title: gameTitle,
            description,
            date: new Date(gameDate),
            locationName: locationName || "Local Personalizado",
            lat: newGameLocation.lat,
            lng: newGameLocation.lng,
            maxPlayers,
            price: 0,
            confirmedPlayers: []
        };

        const success = await dbService.createPickupGame(newGame);
        if (success) {
            alert("Pelada criada com sucesso!");
            setFormStep(1);
            setGameTitle('');
            setGameDate('');
            setActiveTab('explore');
            loadData();
        } else {
            alert("Erro ao criar pelada.");
        }
    };

    // Helper to select an existing court for the new game
    const selectCourtForGame = (court: Court) => {
        setNewGameLocation({ lat: court.lat, lng: court.lng });
        setLocationName(court.name);
        // auto advance could happen here, but let user confirm on map
    };

    const createPinIcon = (isPaid: boolean) => L.divIcon({
        className: 'location-pin',
        html: `<div class="relative w-14 h-14 group">
                <div class="absolute inset-0 ${isPaid ? 'bg-gold' : 'bg-neon'} rounded-full blur-md opacity-40 group-hover:opacity-80 animate-pulse"></div>
                <div class="relative w-12 h-12 top-1 left-1 rounded-full border-[3px] ${isPaid ? 'border-gold bg-black' : 'border-neon bg-pitch-950'} flex items-center justify-center shadow-2xl z-10 transition-transform group-hover:scale-110">
                   <span class="text-2xl">${isPaid ? '💲' : '🏟️'}</span>
                </div>
               </div>`,
        iconSize: [56, 56],
        iconAnchor: [28, 28]
    });

    // Determine upcoming games for the viewing modal
    const getUpcomingGamesForLocation = () => {
        if (!viewingCourt && !viewingAdHoc) return [];
        const lat = viewingCourt ? viewingCourt.lat : viewingAdHoc!.lat;
        const lng = viewingCourt ? viewingCourt.lng : viewingAdHoc!.lng;
        
        // Find games very close to this point (approx 100m)
        return games.filter(g => {
             const dist = Math.sqrt(Math.pow(g.lat - lat, 2) + Math.pow(g.lng - lng, 2));
             return dist < 0.001; // Rough proximity
        });
    };

    const upcomingGamesAtLocation = getUpcomingGamesForLocation();

    return (
        <div className="space-y-6 pb-24 h-full flex flex-col relative max-w-4xl mx-auto w-full">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end px-2 gap-4">
                <div>
                    <h2 className="text-4xl font-display font-bold text-white uppercase italic tracking-wide drop-shadow-md">
                        Peladas <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-green-500">Locais</span>
                    </h2>
                    <p className="text-gray-400 text-sm font-medium">Encontre jogos próximos ou organize a resenha.</p>
                </div>
                
                {/* Tabs / Switcher */}
                <div className="bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 flex self-start">
                    <button 
                        onClick={() => setActiveTab('explore')}
                        className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase transition-all duration-300 flex items-center gap-2 ${activeTab === 'explore' ? 'bg-neon text-pitch-950 shadow-[0_0_15px_rgba(57,255,20,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span>🔭</span> Explorar
                    </button>
                    <button 
                        onClick={() => setActiveTab('create')}
                        className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase transition-all duration-300 flex items-center gap-2 ${activeTab === 'create' ? 'bg-neon text-pitch-950 shadow-[0_0_15px_rgba(57,255,20,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span>📅</span> Criar Jogo
                    </button>
                </div>
            </div>

            {/* EXPLORE TAB */}
            {activeTab === 'explore' && (
                <div className="space-y-4 animate-[fadeIn_0.4s_ease-out]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-10 h-10 border-4 border-neon border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-neon text-xs font-bold uppercase tracking-widest animate-pulse">Buscando Jogos...</p>
                        </div>
                    ) : games.length === 0 ? (
                        <div className="text-center py-16 bg-gradient-to-b from-white/5 to-transparent rounded-3xl border border-dashed border-white/10 mx-2">
                            <div className="w-20 h-20 bg-pitch-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <span className="text-4xl opacity-50">🏟️</span>
                            </div>
                            <h3 className="font-bold text-white text-lg">Nenhuma pelada encontrada.</h3>
                            <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">Seja o pioneiro! Crie o primeiro jogo da região e convide a galera.</p>
                            <button onClick={() => setActiveTab('create')} className="mt-6 bg-white text-black font-bold px-8 py-3 rounded-xl text-sm hover:scale-105 transition-transform shadow-lg">Criar Pelada Agora</button>
                        </div>
                    ) : (
                        <div className="grid gap-6 px-2 md:grid-cols-2 lg:grid-cols-2">
                            {games.map(game => {
                                const isJoined = game.confirmedPlayers.includes(currentUser.id);
                                const slotsLeft = game.maxPlayers - game.confirmedPlayers.length;
                                const percent = (game.confirmedPlayers.length / game.maxPlayers) * 100;
                                const dateObj = new Date(game.date);
                                
                                return (
                                    <div key={game.id} className="relative group overflow-hidden bg-pitch-950 border border-white/10 rounded-[2rem] hover:border-neon/40 transition-all duration-300 shadow-2xl hover:shadow-[0_0_30px_rgba(57,255,20,0.1)]">
                                        
                                        {/* Decorative Gradient Glow */}
                                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-neon/20 transition-colors"></div>

                                        <div className="p-6 relative z-10">
                                            
                                            {/* Header: Date Badge & Title */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1 pr-4">
                                                    <h3 className="text-2xl font-display font-bold text-white uppercase leading-none mb-2 truncate group-hover:text-neon transition-colors">
                                                        {game.title}
                                                    </h3>
                                                    
                                                    {/* Location Pill */}
                                                    <button 
                                                        onClick={() => setViewingAdHoc({lat: game.lat, lng: game.lng, name: game.locationName})}
                                                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon/50 px-3 py-1.5 rounded-lg transition-all group/loc"
                                                    >
                                                        <span className="text-neon text-lg">📍</span> 
                                                        <span className="text-xs font-bold text-gray-300 group-hover/loc:text-white truncate max-w-[150px]">{game.locationName}</span>
                                                        <span className="text-[10px] text-neon uppercase font-bold opacity-0 group-hover/loc:opacity-100 transition-opacity ml-1">Ver Mapa</span>
                                                    </button>
                                                </div>

                                                {/* Date Ticket */}
                                                <div className="flex flex-col items-center justify-center bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-2 min-w-[70px]">
                                                    <span className="text-neon font-display font-bold text-2xl leading-none">{dateObj.getDate()}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{dateObj.toLocaleDateString('pt-BR', {month: 'short'}).replace('.','')}</span>
                                                    <div className="w-full h-px bg-white/10 my-1"></div>
                                                    <span className="text-white font-bold text-xs">{dateObj.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className="mb-6">
                                                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 italic">
                                                    "{game.description || "Resenha garantida. Traga sua chuteira e colete se tiver."}"
                                                </p>
                                            </div>

                                            {/* Host & Progress Section */}
                                            <div className="bg-black/30 rounded-xl p-3 border border-white/5 mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-black p-[1px]">
                                                        <img 
                                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(game.hostName)}&background=random`} 
                                                            className="w-full h-full rounded-full object-cover" 
                                                            alt="Host"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-gray-500 uppercase font-bold">Organizador</p>
                                                        <p className="text-xs text-white font-bold">{game.hostName}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <div className="flex justify-end items-center gap-2 mb-1">
                                                        <p className="text-[9px] text-gray-500 uppercase font-bold">
                                                            {slotsLeft === 0 ? 'Lotado' : `${slotsLeft} Vagas`}
                                                        </p>
                                                        {game.confirmedPlayers.length > 0 && (
                                                            <button 
                                                                onClick={() => handleViewList(game)} 
                                                                className="text-[9px] text-neon uppercase font-bold hover:underline bg-neon/10 px-1.5 py-0.5 rounded"
                                                            >
                                                                Ver Lista
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full shadow-[0_0_10px_currentColor] transition-all duration-500 ${slotsLeft === 0 ? 'bg-red-500 text-red-500' : 'bg-neon text-neon'}`} 
                                                            style={{ width: `${percent}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <button 
                                                onClick={() => handleJoin(game)}
                                                className={`w-full py-4 rounded-xl font-display font-bold text-xl uppercase tracking-widest transition-all transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${
                                                    isJoined 
                                                    ? 'bg-red-900/20 text-red-500 border border-red-500/30 hover:bg-red-900/40' 
                                                    : slotsLeft === 0 
                                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                                                        : 'bg-neon text-pitch-950 hover:bg-white hover:scale-[1.01] shadow-neon/40'
                                                }`}
                                                disabled={!isJoined && slotsLeft === 0}
                                            >
                                                {isJoined ? (
                                                    <><span>✕</span> Cancelar Presença</>
                                                ) : slotsLeft === 0 ? (
                                                    <><span>🔒</span> Lista de Espera</>
                                                ) : (
                                                    <><span>⚡</span> Confirmar Presença</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* CREATE TAB */}
            {activeTab === 'create' && (
                <div className="flex flex-col h-full bg-pitch-900 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl animate-[slideUp_0.4s_ease-out]">
                    {/* Step Indicator */}
                    <div className="flex bg-black/50 backdrop-blur-sm border-b border-white/10">
                        <div className={`flex-1 text-center text-xs font-bold py-4 uppercase tracking-widest transition-colors ${formStep === 1 ? 'text-neon bg-white/5' : 'text-gray-600'}`}>1. Onde?</div>
                        <div className={`flex-1 text-center text-xs font-bold py-4 uppercase tracking-widest transition-colors ${formStep === 2 ? 'text-neon bg-white/5' : 'text-gray-600'}`}>2. Detalhes</div>
                    </div>

                    {formStep === 1 && (
                        <div className="flex-1 relative flex flex-col">
                            {/* Map */}
                            <div className="flex-1 relative z-0 min-h-[400px]">
                                <MapContainer center={[-23.5505, -46.6333]} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                    {/* Show Existing Courts Markers */}
                                    {courts.map(court => (
                                        <Marker 
                                            key={court.id} 
                                            position={[court.lat, court.lng]} 
                                            eventHandlers={{ click: () => selectCourtForGame(court) }}
                                        />
                                    ))}
                                    <LocationController 
                                        forcedPosition={newGameLocation} 
                                        onLocationSelect={(lat, lng) => {
                                            setNewGameLocation({lat, lng});
                                            setLocationName("Local Selecionado"); // Default, user can edit later
                                        }} 
                                    />
                                </MapContainer>
                                
                                {/* Overlay hint */}
                                <div className="absolute top-4 left-4 right-4 z-[400] flex justify-center pointer-events-none">
                                    <div className="bg-black/70 px-4 py-2 rounded-full text-white text-xs backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-2">
                                        <span className="text-neon animate-pulse">●</span> Toque no mapa ou em uma quadra.
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-pitch-950 border-t border-neon/20 z-10 rounded-t-3xl -mt-6 relative shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                                <label className="block text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">Nome do Local</label>
                                <input 
                                    type="text" 
                                    value={locationName} 
                                    onChange={e => setLocationName(e.target.value)}
                                    placeholder="Ex: Quadra do Zé, Parque Villa Lobos..."
                                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white text-sm mb-4 focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon transition-all"
                                />
                                <button 
                                    onClick={() => setFormStep(2)}
                                    disabled={!newGameLocation}
                                    className="w-full bg-neon text-black font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:scale-[1.02] transition-all uppercase tracking-widest shadow-neon"
                                >
                                    Confirmar Local
                                </button>
                            </div>
                        </div>
                    )}

                    {formStep === 2 && (
                        <div className="p-8 space-y-6 bg-pitch-950 h-full overflow-y-auto">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-neon text-xs font-bold uppercase mb-2 ml-1">Título da Pelada</label>
                                    <input 
                                        type="text" 
                                        value={gameTitle}
                                        onChange={e => setGameTitle(e.target.value)}
                                        placeholder="Ex: Fut de Sexta - Só os craques"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-neon focus:outline-none focus:bg-black transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Data e Hora</label>
                                    <input 
                                        type="datetime-local" 
                                        value={gameDate}
                                        onChange={e => setGameDate(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-neon focus:outline-none focus:bg-black transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Lotação Máxima</label>
                                    <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex items-center gap-6">
                                        <input 
                                            type="range" 
                                            min="10" 
                                            max="30" 
                                            step="1" 
                                            value={maxPlayers}
                                            onChange={e => setMaxPlayers(parseInt(e.target.value))}
                                            className="flex-1 accent-neon h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                                            <span className="text-xl font-bold text-neon">{maxPlayers}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Regras / Observações</label>
                                    <textarea 
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Ex: Levar colete, R$ 10,00 por pessoa, proibido carrinho..."
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-neon focus:outline-none h-32 resize-none focus:bg-black transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-white/5">
                                <button 
                                    onClick={() => setFormStep(1)}
                                    className="w-16 bg-white/5 text-gray-400 font-bold py-4 rounded-xl hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    ←
                                </button>
                                <button 
                                    onClick={handleCreateGame}
                                    disabled={!gameTitle || !gameDate}
                                    className="flex-1 bg-neon text-black font-bold py-4 rounded-xl disabled:opacity-50 hover:bg-white hover:scale-[1.02] transition-all uppercase tracking-widest shadow-neon"
                                >
                                    Agendar Jogo 🚀
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* LOCATION VIEW MODAL (PREMIUM BOTTOM SHEET) */}
            {(viewingCourt || viewingAdHoc) && (
                <div className="fixed inset-0 bg-black z-[2000] animate-[fadeIn_0.2s_ease-out]">
                    
                    {/* Full Screen Map */}
                    <div className="absolute inset-0 z-0">
                         <MapContainer 
                            center={[viewingCourt ? viewingCourt.lat : viewingAdHoc!.lat, viewingCourt ? viewingCourt.lng : viewingAdHoc!.lng]} 
                            zoom={16} 
                            style={{ height: "100%", width: "100%" }} 
                            zoomControl={false}
                         >
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            <Marker 
                                position={[viewingCourt ? viewingCourt.lat : viewingAdHoc!.lat, viewingCourt ? viewingCourt.lng : viewingAdHoc!.lng]} 
                                icon={createPinIcon(viewingCourt?.isPaid || false)} 
                            />
                        </MapContainer>
                    </div>

                    {/* Back Button */}
                    <button 
                        onClick={() => { setViewingCourt(null); setViewingAdHoc(null); }}
                        className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full text-white hover:bg-white/20 backdrop-blur-md"
                    >
                        ✕
                    </button>

                    {/* Bottom Sheet Card */}
                    <div className="absolute bottom-4 left-2 right-2 md:bottom-6 md:left-6 md:right-auto md:w-96 z-10 animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] max-h-[70vh] flex flex-col">
                       <div className="bg-pitch-950/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden group ring-1 ring-white/5 flex flex-col">
                           
                           <div className="flex items-center gap-4 mb-5 relative z-10 pr-8">
                               {/* Logo with status ring */}
                               <div className="relative">
                                    <div className={`w-16 h-16 rounded-2xl bg-black border-2 ${viewingCourt?.isPaid ? 'border-gold shadow-gold/20' : 'border-neon shadow-neon/20'} p-1 shadow-lg flex items-center justify-center`}>
                                        <span className="text-3xl">{viewingCourt?.isPaid ? '💲' : '🏟️'}</span>
                                    </div>
                               </div>

                               <div>
                                   <h3 className="text-xl font-display font-bold text-white uppercase leading-tight mb-1">{viewingCourt ? viewingCourt.name : viewingAdHoc?.name}</h3>
                                   <div className="flex gap-2">
                                       <span className="text-xs text-gray-400 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                                           Quadra Esportiva
                                       </span>
                                       {viewingCourt?.isPaid && (
                                           <span className="text-xs text-black bg-gold font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                                               Paga
                                           </span>
                                       )}
                                       {viewingCourt && !viewingCourt.isPaid && (
                                           <span className="text-xs text-black bg-neon font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                                               Grátis
                                           </span>
                                       )}
                                   </div>
                               </div>
                           </div>

                           <a 
                               href={`https://www.google.com/maps/search/?api=1&query=${viewingCourt ? viewingCourt.lat : viewingAdHoc!.lat},${viewingCourt ? viewingCourt.lng : viewingAdHoc!.lng}`}
                               target="_blank"
                               rel="noreferrer"
                               className={`block w-full text-center font-bold py-3.5 rounded-xl uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all relative z-10 mb-4 ${viewingCourt?.isPaid ? 'bg-gold text-black shadow-gold/20' : 'bg-neon text-black shadow-neon/20'}`}
                           >
                              🗺️ Navegar (GPS)
                           </a>

                           {/* UPCOMING GAMES LIST */}
                           <div className="border-t border-white/10 pt-4 relative z-10 overflow-y-auto max-h-48">
                               <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 sticky top-0 bg-pitch-950/95 py-1 z-20">Próximos Jogos Aqui</h4>
                               {upcomingGamesAtLocation.length === 0 ? (
                                   <p className="text-sm text-gray-400 italic">Nenhuma pelada marcada para os próximos dias.</p>
                               ) : (
                                   <div className="space-y-2">
                                       {upcomingGamesAtLocation.map(g => (
                                           <div key={g.id} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                               <div>
                                                   <p className="text-sm font-bold text-white">{g.title}</p>
                                                   <p className="text-[10px] text-gray-400">
                                                       {new Date(g.date).toLocaleDateString()} às {new Date(g.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                   </p>
                                               </div>
                                               <button 
                                                    onClick={() => {
                                                        handleJoin(g);
                                                        // Close location modal or just refresh logic handled by join
                                                    }}
                                                    className={`text-[10px] font-bold px-3 py-1.5 rounded uppercase ${
                                                        g.confirmedPlayers.includes(currentUser.id) 
                                                        ? 'bg-red-900/40 text-red-400 border border-red-500/20' 
                                                        : 'bg-neon/10 text-neon border border-neon/20'
                                                    }`}
                                               >
                                                   {g.confirmedPlayers.includes(currentUser.id) ? 'Sair' : 'Jogar'}
                                               </button>
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </div>

                           {/* Decorative Gradient */}
                           <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none ${viewingCourt?.isPaid ? 'bg-gold' : 'bg-neon'}`}></div>

                       </div>
                    </div>
                </div>
            )}

            {/* PLAYER LIST MODAL */}
            {viewingAttendees && (
                <div className="fixed inset-0 bg-black/90 z-[2500] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-pitch-950 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[70vh]">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50 rounded-t-2xl">
                            <div className="truncate pr-4">
                                <h3 className="text-white font-bold uppercase tracking-wide truncate">{attendeesGameTitle}</h3>
                                <p className="text-[10px] text-neon uppercase font-bold tracking-wider">Lista de Presença ({viewingAttendees.length})</p>
                            </div>
                            <button onClick={() => setViewingAttendees(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10">✕</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {viewingAttendees.length === 0 ? (
                                <p className="text-gray-500 text-center py-4 text-sm italic">Ninguém confirmou presença ainda.</p>
                            ) : (
                                viewingAttendees.map(user => (
                                    <div 
                                        key={user.id} 
                                        onClick={() => onViewPlayer && onViewPlayer(user)} // CLICK HANDLER ADDED
                                        className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                                    >
                                        <img src={user.avatarUrl} className="w-10 h-10 rounded-full object-cover bg-gray-800" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-bold text-sm">{user.name}</span>
                                                {user.role === UserRole.OWNER && <span className="text-[8px] bg-gold text-black px-1 rounded font-bold">DONO</span>}
                                            </div>
                                            <p className="text-[10px] text-gray-400 uppercase font-mono">{user.position || 'Jogador'}</p>
                                        </div>
                                        {user.stats?.rating && (
                                            <div className="text-center">
                                                <span className="block text-neon font-display text-lg font-bold leading-none">{user.stats.rating}</span>
                                                <span className="text-[8px] text-gray-500 uppercase">OVR</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};