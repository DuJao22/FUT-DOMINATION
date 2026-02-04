import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { dbService } from '../services/database';
import { Match, User } from '../types';

// Component to handle map clicks and set location
const LocationPicker = ({ onLocationSelect, initialPosition }: { onLocationSelect: (lat: number, lng: number) => void, initialPosition?: [number, number] }) => {
    const [position, setPosition] = useState<[number, number] | null>(initialPosition || null);
    
    // Icon for selection
    const selectionIcon = L.divIcon({
        className: 'selection-marker',
        html: `<div class="w-8 h-8 text-3xl drop-shadow-md">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });

    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    const map = useMap();
    useEffect(() => {
        if(initialPosition) {
             map.flyTo(initialPosition, 16);
             setPosition(initialPosition);
        } else {
            // Try to locate user initially if no position
             map.locate().on("locationfound", function (e) {
                map.flyTo(e.latlng, 15);
            });
        }
    }, [map, initialPosition]);

    return position ? <Marker position={position} icon={selectionIcon} /> : null;
};

interface MatchLoggerProps {
    onClose: () => void;
    currentUser: User;
    userTeamId: string;
}

export const MatchLogger: React.FC<MatchLoggerProps> = ({ onClose, currentUser, userTeamId }) => {
  const [step, setStep] = useState<'details' | 'map'>('details');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  
  // Form State
  const [opponentName, setOpponentName] = useState('');
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [proofUrl, setProofUrl] = useState(''); // Changed from file to URL
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if(!coordinates) {
        alert("Por favor selecione o local do jogo no mapa.");
        return;
    }
    
    if (!opponentName) {
        alert("Nome do oponente é obrigatório.");
        return;
    }

    setIsSaving(true);

    try {
        const newMatch: Match = {
            id: `m-${Date.now()}`,
            date: new Date(),
            locationName: `Campo [${coordinates.lat.toFixed(3)}, ${coordinates.lng.toFixed(3)}]`, // Should reverse geocode ideally
            homeTeamId: userTeamId,
            awayTeamName: opponentName,
            homeScore: Number(homeScore),
            awayScore: Number(awayScore),
            isVerified: true
        };

        const success = await dbService.createMatch(newMatch);
        
        if (success) {
            alert("Jogo registrado com sucesso no banco de dados!");
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-pitch-900 border border-neon/50 rounded-2xl w-full max-w-lg shadow-2xl shadow-neon/10 animate-fadeIn overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-pitch-800 flex justify-between items-center bg-pitch-950">
          <h2 className="text-2xl font-display font-bold text-white uppercase">
              {step === 'details' ? 'Registrar Jogo' : 'Marcar Local'}
          </h2>
          <button onClick={onClose} className="text-pitch-400 hover:text-white">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
            {step === 'map' ? (
                 <div className="h-[400px] w-full relative">
                     <MapContainer 
                        center={[40.7128, -74.0060]} 
                        zoom={13} 
                        style={{ height: "100%", width: "100%" }}
                    >
                         <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <LocationPicker 
                            initialPosition={coordinates ? [coordinates.lat, coordinates.lng] : undefined}
                            onLocationSelect={(lat, lng) => setCoordinates({ lat, lng })} 
                        />
                     </MapContainer>
                     <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-bold border border-neon/50 z-[1000] shadow-lg pointer-events-none">
                         Toque no local exato
                     </div>
                 </div>
            ) : (
                <form id="match-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Location Selection Trigger */}
                    <div className="bg-pitch-950 p-4 rounded-xl border border-dashed border-pitch-700">
                        <label className="block text-pitch-300 text-xs font-bold mb-2 uppercase">Local do Jogo (Obrigatório)</label>
                        <div className="flex items-center gap-4">
                            <button 
                                type="button" 
                                onClick={() => setStep('map')}
                                className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 border transition-all ${coordinates ? 'bg-pitch-800 border-neon text-neon' : 'bg-pitch-800 border-pitch-600 text-white hover:bg-pitch-700'}`}
                            >
                                {coordinates ? `📍 Selecionado: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : '🗺️ Abrir Mapa'}
                            </button>
                        </div>
                        <p className="text-xs text-pitch-500 mt-2">Admin deve marcar a quadra exata usada.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-pitch-300 text-xs font-bold mb-1 uppercase">Meu Time</label>
                            <div className="bg-pitch-800 p-3 rounded-lg text-white font-bold text-center border border-pitch-700 truncate">
                                {currentUser.name}
                            </div>
                            <input 
                                type="number" 
                                className="mt-2 w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-center text-2xl font-display font-bold text-white focus:border-neon focus:outline-none" 
                                value={homeScore}
                                onChange={(e) => setHomeScore(parseInt(e.target.value))}
                                min={0}
                            />
                        </div>

                        <div className="flex flex-col items-center justify-center pt-6">
                            <span className="text-pitch-500 font-display text-2xl font-bold italic">X</span>
                        </div>

                        <div>
                            <label className="block text-pitch-300 text-xs font-bold mb-1 uppercase">Oponente</label>
                            <input 
                                type="text" 
                                className="w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-white text-center text-sm mb-2 focus:border-neon focus:outline-none placeholder-gray-600" 
                                placeholder="Nome do Time"
                                value={opponentName}
                                onChange={(e) => setOpponentName(e.target.value)}
                                required
                            />
                            <input 
                                type="number" 
                                className="w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-center text-2xl font-display font-bold text-white focus:border-neon focus:outline-none" 
                                value={awayScore}
                                onChange={(e) => setAwayScore(parseInt(e.target.value))}
                                min={0}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-pitch-300 text-xs font-bold mb-1 uppercase">Prova do Jogo (Link)</label>
                        <input 
                            type="text" 
                            className="w-full bg-pitch-950 border border-pitch-700 rounded-lg p-3 text-white text-sm focus:border-neon focus:outline-none placeholder-gray-600"
                            placeholder="https://imgur.com/..."
                            value={proofUrl}
                            onChange={(e) => setProofUrl(e.target.value)}
                        />
                        <p className="text-[10px] text-pitch-500 mt-1">Cole o link da foto do placar (Ex: Google Photos, Imgur).</p>
                    </div>
                </form>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-pitch-800 bg-pitch-950">
             {step === 'map' ? (
                 <button 
                    type="button"
                    onClick={() => setStep('details')}
                    className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest text-sm"
                 >
                    {coordinates ? 'Confirmar Local' : 'Voltar'}
                 </button>
             ) : (
                <button 
                    type="submit"
                    form="match-form"
                    disabled={isSaving}
                    className="w-full bg-neon text-pitch-950 font-bold py-3 rounded-xl hover:bg-green-400 transition-all shadow-lg shadow-neon/20 uppercase tracking-widest text-lg flex justify-center"
                >
                    {isSaving ? 'Salvando...' : 'Reivindicar Vitória'}
                </button>
             )}
        </div>

      </div>
    </div>
  );
};