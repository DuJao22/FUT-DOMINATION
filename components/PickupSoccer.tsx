import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { PickupGame, User, Court } from '../types';
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
}

export const PickupSoccer: React.FC<PickupSoccerProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<'explore' | 'create'>('explore');
    const [games, setGames] = useState<PickupGame[]>([]);
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="space-y-6 pb-24 h-full flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center px-2">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white uppercase italic tracking-wide">
                        Peladas <span className="text-neon">Locais</span>
                    </h2>
                    <p className="text-gray-400 text-xs">Encontre jogos ou marque o seu.</p>
                </div>
                <div className="bg-pitch-900 p-1 rounded-lg border border-white/10 flex">
                    <button 
                        onClick={() => setActiveTab('explore')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'explore' ? 'bg-neon text-black' : 'text-gray-400'}`}
                    >
                        Explorar
                    </button>
                    <button 
                        onClick={() => setActiveTab('create')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'create' ? 'bg-neon text-black' : 'text-gray-400'}`}
                    >
                        Criar
                    </button>
                </div>
            </div>

            {/* EXPLORE TAB */}
            {activeTab === 'explore' && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Carregando jogos...</div>
                    ) : games.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10 mx-4">
                            <span className="text-4xl block mb-2 opacity-50">⚽</span>
                            <p className="font-bold text-white">Nenhuma pelada encontrada.</p>
                            <p className="text-xs text-gray-500 mt-1">Seja o primeiro a marcar um jogo na sua área!</p>
                            <button onClick={() => setActiveTab('create')} className="mt-4 bg-neon text-black font-bold px-6 py-2 rounded-lg text-xs hover:bg-white">Criar Pelada</button>
                        </div>
                    ) : (
                        <div className="grid gap-4 px-2 md:grid-cols-2">
                            {games.map(game => {
                                const isJoined = game.confirmedPlayers.includes(currentUser.id);
                                const slotsLeft = game.maxPlayers - game.confirmedPlayers.length;
                                const percent = (game.confirmedPlayers.length / game.maxPlayers) * 100;
                                
                                return (
                                    <div key={game.id} className="bg-pitch-900 border border-white/10 rounded-2xl p-4 shadow-lg hover:border-neon/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{game.title}</h3>
                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                    <span>📍</span> {game.locationName}
                                                </p>
                                            </div>
                                            <div className="bg-black/40 px-2 py-1 rounded text-center">
                                                <span className="block text-[10px] text-gray-400 uppercase font-bold">Data</span>
                                                <span className="text-neon font-bold text-xs">
                                                    {new Date(game.date).toLocaleDateString()}
                                                </span>
                                                <span className="block text-[10px] text-white">
                                                    {new Date(game.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-300 mb-4 line-clamp-2">{game.description || "Sem descrição."}</p>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                                                <span className="text-gray-400">Confirmados</span>
                                                <span className={slotsLeft === 0 ? 'text-red-500' : 'text-neon'}>
                                                    {game.confirmedPlayers.length}/{game.maxPlayers}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-black rounded-full overflow-hidden">
                                                <div className={`h-full ${slotsLeft === 0 ? 'bg-red-500' : 'bg-neon'}`} style={{ width: `${percent}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-gray-500">Host: {game.hostName}</span>
                                            <button 
                                                onClick={() => handleJoin(game)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-transform active:scale-95 ${
                                                    isJoined 
                                                    ? 'bg-red-900/50 text-red-300 border border-red-500/30 hover:bg-red-900' 
                                                    : slotsLeft === 0 
                                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                        : 'bg-neon text-black shadow-neon hover:bg-white'
                                                }`}
                                                disabled={!isJoined && slotsLeft === 0}
                                            >
                                                {isJoined ? 'Sair do Jogo' : slotsLeft === 0 ? 'Lotado' : 'Eu Vou!'}
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
                <div className="flex flex-col h-full bg-pitch-900 rounded-t-3xl border-t border-white/10 overflow-hidden shadow-2xl">
                    {/* Step Indicator */}
                    <div className="flex bg-black p-2">
                        <div className={`flex-1 text-center text-xs font-bold py-2 ${formStep === 1 ? 'text-neon border-b-2 border-neon' : 'text-gray-500'}`}>1. Local</div>
                        <div className={`flex-1 text-center text-xs font-bold py-2 ${formStep === 2 ? 'text-neon border-b-2 border-neon' : 'text-gray-500'}`}>2. Detalhes</div>
                    </div>

                    {formStep === 1 && (
                        <div className="flex-1 relative flex flex-col">
                            {/* Map */}
                            <div className="flex-1 relative z-0">
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
                                <div className="absolute top-4 left-4 z-[400] bg-black/70 px-3 py-2 rounded-lg text-white text-xs backdrop-blur-md border border-white/10">
                                    Toque no mapa ou em uma quadra existente.
                                </div>
                            </div>

                            <div className="p-4 bg-pitch-950 border-t border-white/10 z-10">
                                <p className="text-gray-400 text-xs mb-2 font-bold uppercase">Local Escolhido:</p>
                                <input 
                                    type="text" 
                                    value={locationName} 
                                    onChange={e => setLocationName(e.target.value)}
                                    placeholder="Nome do local (Ex: Quadra do Zé)"
                                    className="w-full bg-black border border-white/20 rounded-lg p-3 text-white text-sm mb-4 focus:border-neon focus:outline-none"
                                />
                                <button 
                                    onClick={() => setFormStep(2)}
                                    disabled={!newGameLocation}
                                    className="w-full bg-neon text-black font-bold py-3 rounded-xl disabled:opacity-50"
                                >
                                    Confirmar Local
                                </button>
                            </div>
                        </div>
                    )}

                    {formStep === 2 && (
                        <div className="p-6 space-y-4 bg-pitch-900 h-full overflow-y-auto">
                            <div>
                                <label className="block text-neon text-xs font-bold uppercase mb-1">Título da Pelada</label>
                                <input 
                                    type="text" 
                                    value={gameTitle}
                                    onChange={e => setGameTitle(e.target.value)}
                                    placeholder="Ex: Fut de Sexta"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-neon focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Data e Hora</label>
                                <input 
                                    type="datetime-local" 
                                    value={gameDate}
                                    onChange={e => setGameDate(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-neon focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Máximo de Jogadores</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="30" 
                                        step="1" 
                                        value={maxPlayers}
                                        onChange={e => setMaxPlayers(parseInt(e.target.value))}
                                        className="flex-1 accent-neon h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-xl font-bold text-white w-10 text-center">{maxPlayers}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Descrição / Regras</label>
                                <textarea 
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Levar colete, 10 reais por pessoa..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-neon focus:outline-none h-24 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    onClick={() => setFormStep(1)}
                                    className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-xl"
                                >
                                    Voltar
                                </button>
                                <button 
                                    onClick={handleCreateGame}
                                    disabled={!gameTitle || !gameDate}
                                    className="flex-[2] bg-neon text-black font-bold py-3 rounded-xl disabled:opacity-50 hover:bg-white transition-colors"
                                >
                                    Agendar Jogo 🚀
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};