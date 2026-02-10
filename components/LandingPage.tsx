import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-pitch-950 font-sans text-gray-100 selection:bg-neon selection:text-black overflow-x-hidden">
      
      {/* --- LIVE TICKER (TOP) --- */}
      <div className="bg-neon/5 border-b border-neon/10 overflow-hidden py-1.5 relative z-50 backdrop-blur-sm">
          <div className="whitespace-nowrap animate-[shimmer_30s_linear_infinite] flex gap-12 items-center text-[10px] md:text-xs font-bold text-neon uppercase tracking-widest opacity-80">
              <span className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> AO VIVO: Real Osasco conquistou a Arena Vila Yara</span>
              <span className="flex items-center gap-2">💰 Mercado: João "Canhão" assinou com o Baixada FC (Valor: R$ 0)</span>
              <span className="flex items-center gap-2">🏆 Ranking: Inter ZL assumiu o Top 1 da Zona Leste</span>
              <span className="flex items-center gap-2">⚽ Nova Pelada "Sexta dos Amigos" criada no Centro</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> AO VIVO: Real Osasco conquistou a Arena Vila Yara</span>
              <span className="flex items-center gap-2">💰 Mercado: João "Canhão" assinou com o Baixada FC</span>
          </div>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-10 w-full z-40 px-4 md:px-6 pointer-events-none">
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-6 pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={onGetStarted}>
            <div className="text-3xl font-display font-bold tracking-wider text-white group-hover:scale-105 transition-transform italic">
                FUT<span className="text-neon drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]">-DOMINATION</span>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={onGetStarted} className="hidden md:block text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest hover:underline decoration-neon underline-offset-4">
                Login
            </button>
            <button 
                onClick={onGetStarted}
                className="bg-white text-black px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-neon hover:scale-105 hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all uppercase tracking-wide flex items-center gap-2"
            >
                Entrar Agora <span>→</span>
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-44 pb-20 md:pt-60 md:pb-32 px-6 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-neon/20 rounded-full blur-[150px] pointer-events-none opacity-40 animate-pulse-slow"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pitch-950/80 to-pitch-950 pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon/20 bg-neon/5 backdrop-blur-md mb-8 animate-[slideUp_0.5s_ease-out]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon"></span>
            </span>
            <span className="text-neon text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Sistema Operacional da Várzea</span>
          </div>
          
          <h1 className="text-6xl md:text-9xl font-display font-bold text-white uppercase italic leading-[0.85] mb-8 drop-shadow-2xl tracking-tighter animate-[slideUp_0.7s_ease-out]">
            Do Terrão ao <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon via-white to-neon animate-shimmer bg-[length:200%_auto]">Profissional</span>
          </h1>
          
          <p className="text-sm md:text-lg text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light animate-[slideUp_0.9s_ease-out] border-l-2 border-neon/50 pl-6 text-left md:text-center md:border-none md:pl-0">
            FUT-DOMINATION transforma o futebol de fim de semana em um jogo de estratégia real. 
            <span className="text-white font-bold"> Conquiste bairros, gerencie sua equipe e suba no ranking global.</span>
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center animate-[slideUp_1.1s_ease-out]">
            <button 
              onClick={onGetStarted}
              className="w-full md:w-auto bg-neon text-black font-display font-bold text-2xl px-12 py-5 rounded-2xl hover:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.5)] transition-all uppercase tracking-wide flex items-center justify-center gap-3 group"
            >
              <span>🚀</span> Começar Agora
              <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button 
                onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-gray-400 hover:text-white font-bold text-xs px-8 py-5 rounded-xl border border-white/10 hover:bg-white/5 transition-all uppercase tracking-widest hover:border-white/30"
            >
                Como Funciona
            </button>
          </div>
        </div>
      </section>

      {/* --- SPONSORSHIP STRIP --- */}
      <section className="py-8 border-y border-white/5 bg-black/40 backdrop-blur-sm relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-[10px] uppercase font-bold text-gray-600 tracking-[0.3em] whitespace-nowrap">Oferecido por</p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  <div className="flex items-center gap-2 group">
                      <div className="w-8 h-8 bg-white text-black font-bold flex items-center justify-center rounded text-xs group-hover:bg-neon transition-colors">DS</div>
                      <span className="font-display font-bold text-xl text-white tracking-widest group-hover:text-neon transition-colors">DS COMPANY</span>
                  </div>
                  {/* Fake Sponsors for aesthetic */}
                  <span className="font-display font-bold text-2xl text-gray-500 hover:text-white transition-colors cursor-default">NIKE F.C.</span>
                  <span className="font-display font-bold text-2xl text-gray-500 hover:text-white transition-colors cursor-default">GATORADE</span>
                  <span className="font-display font-bold text-2xl text-gray-500 hover:text-white transition-colors cursor-default">PREMIER LEAGUE</span>
              </div>
          </div>
      </section>

      {/* --- CHOOSE YOUR SIDE (Role Split) --- */}
      <section id="roles" className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-display font-bold text-white uppercase italic mb-4">
                      Escolha Seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-neon">Lado</span>
                  </h2>
                  <p className="text-gray-400 text-sm">O sistema se adapta ao seu estilo de jogo.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* DONO DE TIME */}
                  <div onClick={onGetStarted} className="group relative bg-gradient-to-br from-pitch-900 to-black border border-white/10 rounded-[2.5rem] p-8 md:p-12 overflow-hidden hover:border-neon/50 transition-all duration-500 cursor-pointer shadow-2xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-neon/10 rounded-full blur-[80px] group-hover:bg-neon/20 transition-colors"></div>
                      <div className="relative z-10">
                          <div className="w-16 h-16 bg-neon text-black rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-[0_0_20px_rgba(57,255,20,0.3)] group-hover:scale-110 transition-transform">
                              👑
                          </div>
                          <h3 className="text-3xl font-display font-bold text-white uppercase mb-2 group-hover:text-neon transition-colors">Dono de Time</h3>
                          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                              Para quem organiza. Crie o escudo, gerencie o elenco, marque amistosos e leve seu time ao topo do ranking regional.
                          </p>
                          <ul className="space-y-3 mb-8">
                              <li className="flex items-center gap-3 text-sm text-gray-300"><span className="text-neon">✓</span> Gestão de Elenco & Transferências</li>
                              <li className="flex items-center gap-3 text-sm text-gray-300"><span className="text-neon">✓</span> Agendamento de Jogos Oficiais</li>
                              <li className="flex items-center gap-3 text-sm text-gray-300"><span className="text-neon">✓</span> Editor de Escudo & Uniforme</li>
                          </ul>
                          <span className="text-neon font-bold text-xs uppercase tracking-widest border-b border-neon pb-1">Criar Clube Grátis</span>
                      </div>
                  </div>

                  {/* JOGADOR */}
                  <div onClick={onGetStarted} className="group relative bg-gradient-to-br from-blue-950 to-black border border-white/10 rounded-[2.5rem] p-8 md:p-12 overflow-hidden hover:border-blue-400/50 transition-all duration-500 cursor-pointer shadow-2xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] group-hover:bg-blue-500/20 transition-colors"></div>
                      <div className="relative z-10">
                          <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform">
                              ⚽
                          </div>
                          <h3 className="text-3xl font-display font-bold text-white uppercase mb-2 group-hover:text-blue-400 transition-colors">Jogador</h3>
                          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                              Para quem joga. Crie seu card estilo FIFA, receba propostas de times, confirme presença em peladas e acompanhe suas estatísticas.
                          </p>
                          <ul className="space-y-3 mb-8">
                              <li className="flex items-center gap-3 text-sm text-gray-300"><span className="text-blue-400">✓</span> Card de Jogador com OVR</li>
                              <li className="flex items-center gap-3 text-sm text-gray-300"><span className="text-blue-400">✓</span> Histórico de Gols & MVPs</li>
                              <li className="flex items-center gap-3 text-sm text-gray-300"><span className="text-blue-400">✓</span> Encontrar Peladas Próximas</li>
                          </ul>
                          <span className="text-blue-400 font-bold text-xs uppercase tracking-widest border-b border-blue-400 pb-1">Iniciar Carreira</span>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- FEATURE LIST (8 PILLARS) --- */}
      <section className="py-24 px-6 bg-black/40 border-t border-white/5 relative">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-display font-bold text-white uppercase italic mb-4">
                      Domínio <span className="text-neon">Total</span>
                  </h2>
                  <p className="text-gray-400 text-sm max-w-xl mx-auto">
                      8 funcionalidades essenciais integradas em uma única plataforma.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Feature 1: MAPA */}
                  <div className="bg-pitch-900/30 backdrop-blur-sm border border-white/5 p-6 rounded-2xl group hover:bg-pitch-900 hover:border-neon/30 transition-all duration-300">
                      <div className="w-12 h-12 bg-black rounded-xl border border-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform group-hover:border-neon shadow-lg">🗺️</div>
                      <h3 className="text-white font-bold uppercase text-lg mb-2 group-hover:text-neon transition-colors">Mapa Real</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                          Check-in em quadras reais. Conquiste territórios para seu time e defenda sua zona de invasores.
                      </p>
                  </div>

                  {/* Feature 2: MERCADO */}
                  <div className="bg-pitch-900/30 backdrop-blur-sm border border-white/5 p-6 rounded-2xl group hover:bg-pitch-900 hover:border-blue-400/30 transition-all duration-300">
                      <div className="w-12 h-12 bg-black rounded-xl border border-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform group-hover:border-blue-400 shadow-lg">🤝</div>
                      <h3 className="text-white font-bold uppercase text-lg mb-2 group-hover:text-blue-400 transition-colors">Transferências</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                          Sistema de contratos. Times podem fazer propostas por "Free Agents" e montar o elenco dos sonhos.
                      </p>
                  </div>

                  {/* Feature 3: SÚMULA */}
                  <div className="bg-pitch-900/30 backdrop-blur-sm border border-white/5 p-6 rounded-2xl group hover:bg-pitch-900 hover:border-red-500/30 transition-all duration-300">
                      <div className="w-12 h-12 bg-black rounded-xl border border-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform group-hover:border-red-500 shadow-lg">📝</div>
                      <h3 className="text-white font-bold uppercase text-lg mb-2 group-hover:text-red-500 transition-colors">Súmula Digital</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                          Pós-jogo detalhado. Registre quem fez gol, quem deu assistência e quem foi o MVP da partida.
                      </p>
                  </div>

                  {/* Feature 4: PELADAS */}
                  <div className="bg-pitch-900/30 backdrop-blur-sm border border-white/5 p-6 rounded-2xl group hover:bg-pitch-900 hover:border-yellow-400/30 transition-all duration-300">
                      <div className="w-12 h-12 bg-black rounded-xl border border-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform group-hover:border-yellow-400 shadow-lg">👟</div>
                      <h3 className="text-white font-bold uppercase text-lg mb-2 group-hover:text-yellow-400 transition-colors">Peladas</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                          Organize jogos avulsos. Lista de presença automática, localizador de quadras e chat pré-jogo.
                      </p>
                  </div>

                  {/* Feature 5: RANKINGS */}
                  <div className="bg-pitch-900/30 backdrop-blur-sm border border-white/5 p-6 rounded-2xl group hover:bg-pitch-900 hover:border-purple-500/30 transition-all duration-300">
                      <div className="w-12 h-12 bg-black rounded-xl border border-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform group-hover:border-purple-500 shadow-lg">🏆</div>
                      <h3 className="text-white font-bold uppercase text-lg mb-2 group-hover:text-purple-500 transition-colors">Rankings</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                          Filtre por Bairro, Cidade ou Estado. Veja quem são os reis da várzea na sua região.
                      </p>
                  </div>

                  {/* Feature 6: CARREIRA */}
                  <div className="bg-pitch-900/30 backdrop-blur-sm border border-white/5 p-6 rounded-2xl group hover:bg-pitch-900 hover:border-gold/30 transition-all duration-300">
                      <div className="w-12 h-12 bg-black rounded-xl border border-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform group-hover:border-gold shadow-lg">⭐</div>
                      <h3 className="text-white font-bold uppercase text-lg mb-2 group-hover:text-gold transition-colors">Modo Carreira</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                          Seu perfil é seu currículo. Card com Overall (OVR) dinâmico, sala de troféus e estatísticas.
                      </p>
                  </div>

                  {/* Feature 7: GESTÃO */}
                  <div className="bg-pitch-900/30 backdrop-blur-sm border border-white/5 p-6 rounded-2xl group hover:bg-pitch-900 hover:border-cyan-400/30 transition-all duration-300">
                      <div className="w-12 h-12 bg-black rounded-xl border border-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform group-hover:border-cyan-400 shadow-lg">📊</div>
                      <h3 className="text-white font-bold uppercase text-lg mb-2 group-hover:text-cyan-400 transition-colors">Gestão</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                          Para donos: Gerencie elenco, promova capitães e mantenha a biografia do time atualizada.
                      </p>
                  </div>

                  {/* Feature 8: AGENDA */}
                  <div className="bg-pitch-900/30 backdrop-blur-sm border border-white/5 p-6 rounded-2xl group hover:bg-pitch-900 hover:border-pink-500/30 transition-all duration-300">
                      <div className="w-12 h-12 bg-black rounded-xl border border-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform group-hover:border-pink-500 shadow-lg">📅</div>
                      <h3 className="text-white font-bold uppercase text-lg mb-2 group-hover:text-pink-500 transition-colors">Matchmaking</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                          Desafie outros times. O sistema envia convites diretos e agenda a partida no calendário.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- VISUAL BENTO GRID (The "Wow" Factor) --- */}
      <section className="py-20 px-4 md:px-6 relative">
        <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-10 text-center">
                <h2 className="text-2xl font-display font-bold text-white uppercase italic">Visualização da Interface</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-5 h-auto md:h-[800px]">
                
                {/* 1. MAPA (Large - Top Left) */}
                <div className="md:col-span-2 md:row-span-2 bg-pitch-950 rounded-[2.5rem] border border-white/10 p-1 relative overflow-hidden group hover:border-neon/30 transition-all duration-500 shadow-2xl">
                    <div className="bg-gradient-to-b from-gray-900 to-black h-full w-full rounded-[2.3rem] overflow-hidden relative">
                        {/* Fake Map */}
                        <div className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-700" style={{
                            backgroundImage: 'url("https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/13/2932/4933.png")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}></div>
                        
                        {/* Radar Effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-transparent via-neon/10 to-transparent rounded-full animate-spin opacity-30 pointer-events-none"></div>

                        {/* Pins */}
                        <div className="absolute top-1/3 left-1/3 w-16 h-16 bg-neon/20 rounded-full border border-neon/50 animate-pulse flex items-center justify-center">
                            <div className="w-3 h-3 bg-neon rounded-full shadow-[0_0_15px_#39ff14]"></div>
                        </div>

                        {/* Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                            <h3 className="text-2xl font-display font-bold text-white uppercase mb-1">Mapa Interativo</h3>
                            <p className="text-gray-400 text-xs">Domine sua quebrada.</p>
                        </div>
                    </div>
                </div>

                {/* 2. PLAYER CARD (Tall - Top Right) */}
                <div className="md:col-span-1 md:row-span-2 bg-pitch-950 rounded-[2.5rem] border border-white/10 p-1 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 shadow-2xl">
                     <div className="h-full w-full bg-gradient-to-b from-gray-800 to-black rounded-[2.3rem] p-6 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6 z-10">
                            <h3 className="text-lg font-display font-bold text-white uppercase italic leading-none">Card<br/><span className="text-gold">Pro</span></h3>
                            <div className="text-right">
                                <span className="block text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-gold to-yellow-700">92</span>
                                <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">OVR</span>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                            <div className="w-24 h-32 border border-white/10 bg-white/5 rounded-t-2xl rounded-b-[3rem] relative flex items-end justify-center pb-4 mb-4">
                                <span className="text-4xl filter grayscale group-hover:grayscale-0 transition-all">🦁</span>
                            </div>
                            <div className="w-full space-y-2">
                                <div className="flex items-center gap-2"><div className="flex-1 h-1 bg-gray-800 rounded-full"><div className="h-full bg-neon w-[88%]"></div></div></div>
                                <div className="flex items-center gap-2"><div className="flex-1 h-1 bg-gray-800 rounded-full"><div className="h-full bg-blue-500 w-[92%]"></div></div></div>
                            </div>
                        </div>
                     </div>
                </div>

                {/* 3. RANKING (Small) */}
                <div className="md:col-span-1 md:row-span-1 bg-pitch-900 rounded-[2rem] border border-white/10 p-5 flex flex-col justify-center relative overflow-hidden group hover:border-white/20 transition-all">
                    <h3 className="text-lg font-display font-bold text-white uppercase mb-2">Ranking</h3>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between p-2 bg-white/5 rounded"><span className="text-gold font-bold">1. Real Osasco</span><span>1200</span></div>
                        <div className="flex justify-between p-2 bg-white/5 rounded"><span className="text-gray-300 font-bold">2. Inter ZL</span><span>1150</span></div>
                    </div>
                </div>

                {/* 4. MARKET (Wide Bottom) */}
                <div className="md:col-span-4 md:row-span-1 bg-gradient-to-r from-pitch-900 to-black rounded-[2rem] border border-white/10 p-6 flex items-center justify-between relative overflow-hidden">
                     <div className="z-10">
                         <h3 className="text-2xl font-display font-bold text-white uppercase mb-1">Mercado Aberto</h3>
                         <p className="text-xs text-gray-400">Contrate jogadores livres e gerencie propostas em tempo real.</p>
                     </div>
                     <div className="flex gap-2">
                         <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-white/10"></div>
                         <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-white/10 -ml-4"></div>
                         <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-white/10 -ml-4 flex items-center justify-center text-[10px] text-white">+12</div>
                     </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="py-24 px-6 bg-gradient-to-b from-pitch-950 to-black border-t border-white/5 text-center relative overflow-hidden">
          {/* Footer Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-neon/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-3xl mx-auto relative z-10">
              <h2 className="text-4xl md:text-6xl font-display font-bold text-white uppercase italic mb-8">
                  Sua História Começa <span className="text-neon">Hoje</span>
              </h2>
              <button 
                onClick={onGetStarted}
                className="bg-white text-black font-bold text-lg px-12 py-4 rounded-xl hover:bg-neon hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] uppercase tracking-wide"
              >
                  Criar Conta Grátis
              </button>
              
              <div className="mt-16 border-t border-white/5 pt-8 flex flex-col items-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-2">
                      Official Partner
                  </p>
                  <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                      <div className="w-6 h-6 bg-white text-black font-bold flex items-center justify-center rounded text-[10px]">DS</div>
                      <span className="font-display font-bold text-lg text-white tracking-widest">DS COMPANY</span>
                  </div>
                  <p className="mt-4 text-[10px] text-gray-600">
                      FUT-DOMINATION © 2025 • Todos os direitos reservados.
                  </p>
              </div>
          </div>
      </section>
    </div>
  );
};