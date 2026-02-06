import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-pitch-950 font-sans text-gray-100 selection:bg-neon selection:text-black overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-pitch-950/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={onGetStarted}>
            <div className="text-3xl font-display font-bold tracking-wider text-white group-hover:scale-105 transition-transform">
                FUT<span className="text-neon drop-shadow-[0_0_10px_rgba(57,255,20,0.8)]">-DOMINATION</span>
            </div>
            <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">
                BETA
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={onGetStarted} className="hidden md:block text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
                Login
            </button>
            <button 
                onClick={onGetStarted}
                className="bg-white text-black px-8 py-2.5 rounded-full font-bold text-sm hover:bg-neon hover:scale-105 hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all uppercase tracking-wide"
            >
                Acessar Sistema
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-neon/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-3 mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/5 backdrop-blur-md hover:bg-neon/10 transition-colors cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neon"></span>
                </span>
                <span className="text-neon text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Sistema em Produção</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                <span className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Versão Beta v0.9</span>
              </div>
          </div>
          
          <h1 className="text-6xl md:text-9xl font-display font-bold text-white uppercase italic leading-[0.85] mb-8 drop-shadow-2xl tracking-tighter">
            Profissionalize <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon via-white to-neon bg-[length:200%_auto] animate-shimmer">Sua Paixão</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            Súmulas digitais, mapa de dominação de bairros e mercado da bola. <br className="hidden md:block"/>
            <strong className="text-white">O sistema definitivo para o futebol amador.</strong>
          </p>
          
          <div className="flex flex-col md:flex-row gap-5 justify-center items-center">
            <button 
              onClick={onGetStarted}
              className="w-full md:w-auto bg-neon text-black font-display font-bold text-3xl px-12 py-5 rounded-2xl hover:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.5)] transition-all uppercase tracking-wide flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
              <span className="relative">Criar Conta Grátis</span>
              <svg className="w-6 h-6 relative group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mt-2 md:mt-0 opacity-80 hover:opacity-100 transition-opacity">
                🚧 Funcionalidades novas toda semana
            </p>
          </div>
        </div>
      </section>

      {/* NEW UPDATES SECTION */}
      <section className="py-12 border-y border-white/5 bg-black/20">
          <div className="max-w-7xl mx-auto px-6">
              <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-8">Últimas Atualizações do Sistema</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {/* Update 1 */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-neon/30 transition-colors">
                      <div className="bg-blue-500/20 text-blue-400 p-3 rounded-xl text-2xl">🤝</div>
                      <div>
                          <h4 className="text-white font-bold uppercase text-sm mb-1">Mercado da Bola 2.0</h4>
                          <p className="text-gray-400 text-xs leading-relaxed">
                              Nova hierarquia implementada. Donos acessam a <strong>Central de Scout</strong> para contratar, enquanto jogadores visualizam apenas clubes com seletivas abertas.
                          </p>
                      </div>
                  </div>

                  {/* Update 2 (Former Update 3) */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-neon/30 transition-colors">
                      <div className="bg-green-500/20 text-green-400 p-3 rounded-xl text-2xl">📡</div>
                      <div>
                          <h4 className="text-white font-bold uppercase text-sm mb-1">Feed Social Live</h4>
                          <p className="text-gray-400 text-xs leading-relaxed">
                              O feed "Explorar" agora detecta automaticamente novos times e mudanças de nome, mantendo a comunidade sempre atualizada.
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Feature Grid (Bento Box - FULL SYSTEM) */}
      <section className="py-20 px-4 md:px-6 bg-black/40 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pitch-900 via-pitch-950 to-black opacity-30"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white uppercase italic leading-none">
                        Ecossistema <br/>
                        <span className="text-gray-500">Completo.</span>
                    </h2>
                </div>
            </div>

            {/* BENTO GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-5 h-auto md:h-[850px]">
                
                {/* 1. MAPA (Large - Top Left) */}
                <div className="md:col-span-2 md:row-span-2 bg-pitch-950 rounded-[2.5rem] border border-white/10 p-1 relative overflow-hidden group hover:border-neon/30 transition-all duration-500 shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
                    
                    {/* Inner Container */}
                    <div className="bg-gradient-to-b from-gray-900 to-black h-full w-full rounded-[2.3rem] overflow-hidden relative">
                        {/* Map Visual */}
                        <div className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-700 grayscale group-hover:grayscale-0" style={{
                            backgroundImage: 'url("https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/13/2932/4933.png")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}></div>
                        
                        {/* Radar Scan Effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-transparent via-neon/10 to-transparent rounded-full animate-spin opacity-30 pointer-events-none" style={{animationDuration: '4s'}}></div>

                        {/* Pins & Zones */}
                        <div className="absolute top-1/3 left-1/3 w-24 h-24 bg-neon/20 rounded-full border border-neon/50 animate-pulse flex items-center justify-center">
                            <div className="w-3 h-3 bg-neon rounded-full shadow-[0_0_15px_#39ff14]"></div>
                        </div>
                        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-red-500/10 rounded-full border border-red-500/30 flex items-center justify-center">
                             <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">Dominado</div>
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-2 h-2 rounded-full bg-neon animate-pulse"></span>
                                <span className="text-neon text-xs font-bold uppercase tracking-widest">Território em Disputa</span>
                            </div>
                            <h3 className="text-3xl font-display font-bold text-white uppercase mb-2">Mapa de Guerra</h3>
                            <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                                O bairro é seu tabuleiro. Conquiste quadras reais, defenda sua zona e veja seu escudo dominar o mapa da cidade.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. PLAYER CARD (Tall - Top Right) */}
                <div className="md:col-span-1 md:row-span-2 bg-pitch-950 rounded-[2.5rem] border border-white/10 p-1 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 shadow-2xl">
                     <div className="h-full w-full bg-gradient-to-b from-gray-800 to-black rounded-[2.3rem] p-6 flex flex-col relative overflow-hidden">
                        {/* Background Shine */}
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-gold/10 rounded-full blur-[60px]"></div>
                        
                        <div className="flex justify-between items-start mb-6 z-10">
                            <h3 className="text-xl font-display font-bold text-white uppercase italic leading-none">Seu Card<br/><span className="text-gold">Pro</span></h3>
                            <div className="text-right">
                                <span className="block text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-gold to-yellow-700">92</span>
                                <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">OVR</span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center relative z-10 gap-6">
                            {/* Card Shape */}
                            <div className="w-32 h-40 border border-white/10 bg-white/5 rounded-t-2xl rounded-b-[4rem] relative flex items-end justify-center pb-4 shadow-[0_0_30px_rgba(251,191,36,0.1)] group-hover:shadow-[0_0_40px_rgba(251,191,36,0.2)] transition-shadow">
                                <span className="text-5xl drop-shadow-xl filter grayscale group-hover:grayscale-0 transition-all duration-500">🦁</span>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-1 bg-gold rounded-full shadow-[0_0_10px_#fbbf24]"></div>
                            </div>

                            {/* Stats Bars */}
                            <div className="w-full space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 w-6">VEL</span>
                                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-neon w-[88%]"></div></div>
                                    <span className="text-[10px] font-bold text-white">88</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 w-6">FIN</span>
                                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[92%]"></div></div>
                                    <span className="text-[10px] font-bold text-white">92</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 w-6">PAS</span>
                                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[85%]"></div></div>
                                    <span className="text-[10px] font-bold text-white">85</span>
                                </div>
                            </div>
                        </div>
                     </div>
                </div>

                {/* 3. MATCH CENTER (Small - Top Right) */}
                <div className="md:col-span-1 md:row-span-1 bg-pitch-900 rounded-[2rem] border border-white/10 p-5 flex flex-col justify-between group hover:bg-pitch-800 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12">⚔️</div>
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold uppercase animate-pulse">Ao Vivo</span>
                            <span className="text-[9px] text-gray-500 font-mono">42' 2T</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white text-lg">ZL FC</span>
                            <span className="font-display font-bold text-2xl text-neon">3-2</span>
                            <span className="font-bold text-white text-lg">Norte</span>
                        </div>
                        <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                            <div className="w-[85%] h-full bg-red-500"></div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-display font-bold text-white uppercase mt-2">Match Center</h3>
                        <p className="text-[10px] text-gray-400 leading-tight">Súmula digital, gols e estatísticas em tempo real.</p>
                    </div>
                </div>

                {/* 4. RANKINGS (Small - Middle Right) */}
                <div className="md:col-span-1 md:row-span-1 bg-pitch-900 rounded-[2rem] border border-white/10 p-5 flex flex-col group hover:bg-pitch-800 transition-colors relative overflow-hidden">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-display font-bold text-white uppercase">Ranking</h3>
                        <span className="text-xl">🏆</span>
                    </div>
                    <div className="space-y-2 flex-1">
                        <div className="flex justify-between items-center text-xs bg-white/5 p-1.5 rounded">
                            <span className="font-bold text-gold">1. Real Osasco</span>
                            <span className="text-gray-400">1200 pts</span>
                        </div>
                        <div className="flex justify-between items-center text-xs bg-white/5 p-1.5 rounded">
                            <span className="font-bold text-gray-300">2. Inter ZL</span>
                            <span className="text-gray-400">1150 pts</span>
                        </div>
                        <div className="flex justify-between items-center text-xs bg-white/5 p-1.5 rounded">
                            <span className="font-bold text-orange-400">3. Baixada FC</span>
                            <span className="text-gray-400">1100 pts</span>
                        </div>
                    </div>
                </div>

                {/* 5. PICKUP GAMES (Wide - Bottom) */}
                <div className="md:col-span-1 md:row-span-1 bg-gradient-to-br from-blue-900/40 to-black rounded-[2rem] border border-white/10 p-6 relative overflow-hidden group">
                     <div className="relative z-10 h-full flex flex-col justify-end">
                         <div className="mb-auto">
                             <span className="bg-blue-500 text-white text-[9px] font-bold px-2 py-1 rounded uppercase">Pelada</span>
                         </div>
                         <h3 className="text-2xl font-display font-bold text-white uppercase mb-1">Jogos Avulsos</h3>
                         <p className="text-xs text-gray-300 leading-tight mb-3">Faltou um? Encontre completas ou organize sua pelada.</p>
                         <div className="flex -space-x-2">
                             <div className="w-6 h-6 rounded-full bg-gray-500 border border-black"></div>
                             <div className="w-6 h-6 rounded-full bg-gray-400 border border-black"></div>
                             <div className="w-6 h-6 rounded-full bg-gray-300 border border-black flex items-center justify-center text-[8px] font-bold text-black">+4</div>
                         </div>
                     </div>
                </div>

                {/* 6. MARKET & SOCIAL (Wide - Bottom) */}
                <div className="md:col-span-3 md:row-span-1 bg-pitch-900 rounded-[2rem] border border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-white/20 transition-all relative overflow-hidden">
                     {/* Decoration */}
                     <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none"></div>
                     
                     <div className="flex-1 z-10">
                         <h3 className="text-2xl font-display font-bold text-white uppercase leading-none mb-2">Mercado da Bola</h3>
                         <p className="text-sm text-gray-400 max-w-sm">
                             Contrate jogadores livres, receba propostas de times e gerencie transferências.
                         </p>
                     </div>

                     {/* Notification Simulation */}
                     <div className="bg-black/60 backdrop-blur-md border border-neon/30 p-3 rounded-xl flex items-center gap-3 w-full md:w-auto z-10 shadow-lg animate-[slideUp_1s_ease-out]">
                         <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg border border-white/10">📩</div>
                         <div>
                             <p className="text-[10px] text-gray-400 uppercase font-bold">Nova Proposta</p>
                             <p className="text-xs text-white font-bold">Real Madrid da Várzea quer você.</p>
                         </div>
                         <button className="bg-neon text-black text-[10px] font-bold px-3 py-1.5 rounded hover:bg-white transition-colors">Ver</button>
                     </div>
                </div>

            </div>
        </div>
      </section>

      {/* SPONSORSHIP / INVESTOR SECTION */}
      <section className="py-24 px-6 bg-gradient-to-b from-pitch-950 to-black border-t border-white/5 relative">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-gold/10 to-transparent rounded-3xl p-1 border border-gold/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              
              <div className="bg-pitch-950/80 backdrop-blur-xl rounded-[1.3rem] p-8 md:p-12 text-center relative z-10">
                  <span className="inline-block bg-gold/20 text-gold border border-gold/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                      Oportunidade Comercial
                  </span>
                  
                  <h2 className="text-3xl md:text-5xl font-display font-bold text-white uppercase mb-6 leading-tight">
                      Leve sua marca para a <span className="text-gold">Várzea Digital</span>
                  </h2>
                  
                  <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                      O <strong className="text-white">FUT-DOMINATION</strong> está transformando a forma como o futebol amador se organiza. 
                      Aceitamos patrocinadores e parceiros que queiram conectar sua marca a milhares de jogadores e times engajados.
                  </p>

                  <div className="flex flex-col md:flex-row justify-center gap-4">
                      <a href="mailto:parcerias@fut-domination.com" className="bg-gold text-black font-bold px-8 py-4 rounded-xl hover:bg-white transition-all shadow-[0_0_30px_rgba(251,191,36,0.3)] uppercase tracking-wide flex items-center justify-center gap-2">
                          <span>🤝</span> Seja um Patrocinador
                      </a>
                      <button className="text-gold hover:text-white font-bold px-8 py-4 rounded-xl border border-gold/30 hover:border-gold transition-all uppercase tracking-wide">
                          Baixar Mídia Kit
                      </button>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 bg-pitch-950 border-t border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-neon/5 to-transparent pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
              <h2 className="text-4xl md:text-7xl font-display font-bold text-white uppercase italic mb-8 tracking-tighter">
                  Pronto para fazer <br/>História?
              </h2>
              
              <div className="flex flex-col md:flex-row justify-center gap-4">
                   <button 
                    onClick={onGetStarted}
                    className="bg-white text-black font-bold text-lg px-12 py-4 rounded-xl hover:bg-gray-200 transition-transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                   >
                       Criar Conta Grátis
                   </button>
                   <button className="text-gray-400 hover:text-white font-bold px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all">
                       Ver Demo
                   </button>
              </div>
              
              <div className="mt-16 text-center">
                  <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">
                      FUT-DOMINATION © 2025 • Versão Beta
                  </p>
                  <p className="text-gray-500 text-[9px] uppercase tracking-widest mt-1 opacity-70">
                      Desenvolvido por <strong className="text-neon">João Layon</strong> (Full Stack) • <span className="font-semibold text-white">DS Company</span> (Digital Solutions)
                  </p>
              </div>
          </div>
      </section>
    </div>
  );
};