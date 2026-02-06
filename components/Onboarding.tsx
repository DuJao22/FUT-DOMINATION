import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { dbService } from '../services/database';

interface OnboardingProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // --- FORM STATES ---
  const [name, setName] = useState(user.name);
  const [location, setLocation] = useState(user.location || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`);
  
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Role Specifics - Team Address
  const [teamName, setTeamName] = useState('');
  const [teamCategory, setTeamCategory] = useState('Adulto/Livre');
  const [teamLogoUrl, setTeamLogoUrl] = useState('');
  
  // Structured Address State (Mandatory for Ranking)
  const [cep, setCep] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  // Player
  const [position, setPosition] = useState('MID');
  const [shirtNumber, setShirtNumber] = useState('');

  // --- HANDLERS ---
  
  const handleCepBlur = async () => {
      const rawCep = cep.replace(/\D/g, '');
      if (rawCep.length === 8) {
          setIsLoadingCep(true);
          try {
              const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
              const data = await response.json();
              if (!data.erro) {
                  setCity(data.localidade);
                  setState(data.uf);
                  setNeighborhood(data.bairro);
                  setLocation(`${data.localidade} - ${data.uf}`); // Friendly display name
              } else {
                  alert("CEP não encontrado.");
              }
          } catch (e) {
              console.error("Erro ao buscar CEP", e);
          } finally {
              setIsLoadingCep(false);
          }
      }
  };

  const handleNextStep = () => {
      if (step === 1 && name) setStep(2);
      else if (step === 2 && selectedRole) setStep(3);
  };

  const handleFinish = async () => {
      if (!selectedRole) return;
      setLoading(true);

      const profileData = { name, location, position: selectedRole === UserRole.PLAYER ? position : undefined, shirtNumber: selectedRole === UserRole.PLAYER ? parseInt(shirtNumber) : undefined, avatarUrl };
      
      const teamData = selectedRole === UserRole.OWNER ? {
          name: teamName,
          category: teamCategory,
          homeTurf: `${neighborhood}, ${city}`, // Base display string
          city: city, // Strict Ranking Filter
          state: state, // Strict Ranking Filter
          neighborhood: neighborhood, // Strict Ranking Filter
          logoUrl: teamLogoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=random`
      } : undefined;

      const result = await dbService.completeOnboarding(user.id, selectedRole, profileData, teamData);

      if (result.success && result.user) {
          onComplete(result.user);
      } else {
          alert("Erro ao salvar perfil. Tente novamente.");
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-pitch-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
       {/* Background */}
       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon via-blue-500 to-purple-600"></div>
       <div className="absolute -top-20 -right-20 w-64 h-64 bg-neon/10 rounded-full blur-[80px]"></div>
       
       <div className="max-w-xl w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10">
          
          {/* Progress Bar */}
          <div className="flex gap-1 p-1 bg-white/5">
              <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-neon' : 'bg-gray-700'}`}></div>
              <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-neon' : 'bg-gray-700'}`}></div>
              <div className={`h-1 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-neon' : 'bg-gray-700'}`}></div>
          </div>

          <div className="p-8">
              
              {/* --- STEP 1: BASIC PROFILE --- */}
              {step === 1 && (
                  <div className="animate-fadeIn space-y-6">
                      <div className="text-center">
                          <h2 className="text-3xl font-display font-bold text-white uppercase italic">Complete seu Perfil</h2>
                          <p className="text-gray-400 text-sm mt-2">Vamos começar com o básico. Quem é você?</p>
                      </div>

                      <div className="flex justify-center mb-6">
                          <img src={avatarUrl} className="w-24 h-24 rounded-full border-4 border-pitch-800 shadow-lg" />
                      </div>

                      <div>
                          <label className="block text-neon text-xs font-bold mb-1 uppercase">Nome de Craque</label>
                          <input 
                             type="text" 
                             value={name}
                             onChange={e => setName(e.target.value)}
                             className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-neon focus:outline-none"
                             placeholder="Como quer ser chamado?"
                          />
                      </div>

                      <button 
                         onClick={handleNextStep}
                         disabled={!name}
                         className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                      >
                          Próximo
                      </button>
                  </div>
              )}

              {/* --- STEP 2: CHOOSE ROLE --- */}
              {step === 2 && (
                  <div className="animate-slideUp space-y-6">
                      <div className="text-center mb-8">
                          <h2 className="text-3xl font-display font-bold text-white uppercase italic">Escolha seu Caminho</h2>
                          <p className="text-gray-400 text-sm mt-2">Como você vai dominar o território?</p>
                      </div>

                      <div className="grid gap-4">
                          <button 
                             onClick={() => setSelectedRole(UserRole.OWNER)}
                             className={`p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] ${selectedRole === UserRole.OWNER ? 'bg-neon/10 border-neon ring-1 ring-neon' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                          >
                              <div className="flex items-center justify-between mb-2">
                                  <span className="text-3xl">🏆</span>
                                  {selectedRole === UserRole.OWNER && <div className="w-4 h-4 bg-neon rounded-full shadow-[0_0_10px_#39ff14]"></div>}
                              </div>
                              <h3 className="text-xl font-bold text-white uppercase">Dono de Time</h3>
                              <p className="text-xs text-gray-400 mt-1">Crie seu clube, gerencie elenco e marque jogos oficiais.</p>
                          </button>

                          <button 
                             onClick={() => setSelectedRole(UserRole.PLAYER)}
                             className={`p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] ${selectedRole === UserRole.PLAYER ? 'bg-blue-500/10 border-blue-400 ring-1 ring-blue-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                          >
                              <div className="flex items-center justify-between mb-2">
                                  <span className="text-3xl">⚽</span>
                                  {selectedRole === UserRole.PLAYER && <div className="w-4 h-4 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa]"></div>}
                              </div>
                              <h3 className="text-xl font-bold text-white uppercase">Jogador</h3>
                              <p className="text-xs text-gray-400 mt-1">Entre em elencos, registre suas stats e construa sua carreira.</p>
                          </button>
                      </div>

                      <button 
                         onClick={handleNextStep}
                         disabled={!selectedRole}
                         className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                      >
                          Continuar
                      </button>
                  </div>
              )}

              {/* --- STEP 3: ROLE SPECIFIC FORM --- */}
              {step === 3 && (
                  <div className="animate-slideUp space-y-6">
                      
                      {/* --- OWNER FORM --- */}
                      {selectedRole === UserRole.OWNER && (
                          <>
                              <div className="text-center">
                                  <h2 className="text-2xl font-display font-bold text-neon uppercase italic">Fundar Clube</h2>
                                  <p className="text-gray-400 text-xs mt-1">Preencha com atenção. A localização definirá seus rankings.</p>
                              </div>
                              
                              <div>
                                  <label className="block text-gray-400 text-xs font-bold mb-1 uppercase">Nome do Time</label>
                                  <input 
                                      type="text" 
                                      value={teamName}
                                      onChange={e => setTeamName(e.target.value)}
                                      className="w-full bg-black/50 border border-neon/50 rounded-xl p-4 text-white focus:border-neon focus:outline-none placeholder-gray-600"
                                      placeholder="Ex: Real Osasco FC"
                                  />
                              </div>

                              {/* ADDRESS / CEP FIELD */}
                              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                  <h4 className="text-neon text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                      <span>📍</span> Localização da Base
                                  </h4>
                                  
                                  <div className="mb-3">
                                      <label className="block text-gray-400 text-[10px] font-bold uppercase mb-1">CEP (Obrigatório)</label>
                                      <div className="relative">
                                          <input 
                                              type="text" 
                                              value={cep}
                                              onChange={e => {
                                                  const val = e.target.value.replace(/\D/g, '');
                                                  const formatted = val.length > 5 ? `${val.slice(0,5)}-${val.slice(5,8)}` : val;
                                                  setCep(formatted);
                                              }}
                                              onBlur={handleCepBlur}
                                              maxLength={9}
                                              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon focus:outline-none"
                                              placeholder="00000-000"
                                          />
                                          {isLoadingCep && <div className="absolute right-3 top-3 w-4 h-4 border-2 border-neon border-t-transparent rounded-full animate-spin"></div>}
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                      <div>
                                          <label className="block text-gray-400 text-[10px] font-bold uppercase mb-1">Cidade</label>
                                          <input type="text" value={city} readOnly className="w-full bg-black/30 border border-white/5 rounded-lg p-2 text-gray-300 cursor-not-allowed" />
                                      </div>
                                      <div>
                                          <label className="block text-gray-400 text-[10px] font-bold uppercase mb-1">Estado</label>
                                          <input type="text" value={state} readOnly className="w-full bg-black/30 border border-white/5 rounded-lg p-2 text-gray-300 cursor-not-allowed" />
                                      </div>
                                  </div>
                                  <div className="mt-2">
                                      <label className="block text-gray-400 text-[10px] font-bold uppercase mb-1">Bairro</label>
                                      <input type="text" value={neighborhood} readOnly className="w-full bg-black/30 border border-white/5 rounded-lg p-2 text-gray-300 cursor-not-allowed" />
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-gray-400 text-xs font-bold mb-1 uppercase">Categoria</label>
                                  <div className="grid grid-cols-2 gap-2">
                                      {['Sub-15', 'Sub-17', 'Sub-20', 'Adulto/Livre', 'Veterano', 'Society'].map(cat => (
                                          <button
                                              key={cat}
                                              onClick={() => setTeamCategory(cat)}
                                              className={`py-3 rounded-lg text-xs font-bold border transition-all ${teamCategory === cat ? 'bg-neon text-black border-neon' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}
                                          >
                                              {cat}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </>
                      )}

                      {/* --- PLAYER FORM --- */}
                      {selectedRole === UserRole.PLAYER && (
                          <>
                              <div className="text-center">
                                  <h2 className="text-2xl font-display font-bold text-blue-400 uppercase italic">Ficha Técnica</h2>
                              </div>

                              <div>
                                  <label className="block text-gray-400 text-xs font-bold mb-1 uppercase">Posição Principal</label>
                                  <div className="flex gap-2">
                                      {[
                                          {id: 'GK', label: 'Goleiro'}, 
                                          {id: 'DEF', label: 'Defesa'}, 
                                          {id: 'MID', label: 'Meio'}, 
                                          {id: 'FWD', label: 'Ataque'}
                                      ].map(pos => (
                                          <button
                                              key={pos.id}
                                              onClick={() => setPosition(pos.id)}
                                              className={`flex-1 py-4 rounded-xl font-bold border transition-all ${position === pos.id ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 border-transparent text-gray-500'}`}
                                          >
                                              {pos.label}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-gray-400 text-xs font-bold mb-1 uppercase">Número da Camisa</label>
                                  <input 
                                      type="number" 
                                      value={shirtNumber}
                                      onChange={e => setShirtNumber(e.target.value)}
                                      className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-blue-400 focus:outline-none font-mono text-center text-2xl"
                                      placeholder="10"
                                  />
                              </div>
                          </>
                      )}

                      <button 
                         onClick={handleFinish}
                         disabled={loading || (selectedRole === UserRole.OWNER && (!teamName || !city)) || (selectedRole === UserRole.PLAYER && !shirtNumber)}
                         className="w-full bg-neon text-black font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-lg shadow-neon/20 mt-8 flex justify-center items-center gap-2"
                      >
                          {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 'Entrar em Campo 🚀'}
                      </button>
                  </div>
              )}

          </div>
       </div>
    </div>
  );
};