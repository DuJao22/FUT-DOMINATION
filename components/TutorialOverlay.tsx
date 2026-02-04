import React, { useState, useEffect, useLayoutEffect } from 'react';

export interface TutorialStep {
    targetId: string; // ID do elemento HTML alvo
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TutorialOverlayProps {
    steps: TutorialStep[];
    onComplete: () => void;
    onSkip: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ steps, onComplete, onSkip }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [coords, setCoords] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const currentStep = steps[currentStepIndex];

    // Calcula a posição do elemento alvo
    useLayoutEffect(() => {
        const updatePosition = () => {
            if (!currentStep) return;

            // Se a posição for 'center', não buscamos elemento, centralizamos na tela
            if (currentStep.position === 'center') {
                setCoords(null);
                setIsVisible(true);
                return;
            }

            const element = document.getElementById(currentStep.targetId);
            if (element) {
                const rect = element.getBoundingClientRect();
                setCoords({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height
                });
                setIsVisible(true);
                // Scroll suave até o elemento se necessário
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Se o elemento não existe na tela atual (ex: menu fechado), pula ou centraliza
                // Por segurança, vamos centralizar temporariamente se não achar
                setCoords(null); 
                setIsVisible(true);
            }
        };

        // Pequeno delay para garantir que o DOM renderizou
        const timer = setTimeout(updatePosition, 300);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            clearTimeout(timer);
        };
    }, [currentStepIndex, currentStep]);

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setIsVisible(false);
            setCurrentStepIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setIsVisible(false);
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    // Cálculos de estilo para o balão
    const getPopoverStyle = () => {
        if (!coords || currentStep.position === 'center') {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '90vw'
            };
        }

        const gap = 15; // Espaço entre elemento e balão
        let top = 0;
        let left = 0;
        let transform = '';

        // Lógica simples de posicionamento (pode ser melhorada com bibliotecas como floating-ui)
        switch (currentStep.position) {
            case 'bottom':
                top = coords.top + coords.height + gap;
                left = coords.left + (coords.width / 2);
                transform = 'translateX(-50%)';
                break;
            case 'top':
                top = coords.top - gap;
                left = coords.left + (coords.width / 2);
                transform = 'translate(-50%, -100%)';
                break;
            case 'left':
                top = coords.top + (coords.height / 2);
                left = coords.left - gap;
                transform = 'translate(-100%, -50%)';
                break;
            case 'right':
                top = coords.top + (coords.height / 2);
                left = coords.left + coords.width + gap;
                transform = 'translate(0, -50%)';
                break;
            default: // Fallback to bottom
                top = coords.top + coords.height + gap;
                left = coords.left + (coords.width / 2);
                transform = 'translateX(-50%)';
        }

        // Ajustes de borda para mobile (evitar sair da tela)
        const screenW = window.innerWidth;
        if (left < 20) { left = 20; transform = currentStep.position === 'top' || currentStep.position === 'bottom' ? 'translateX(0)' : transform; }
        if (left > screenW - 20) { left = screenW - 20; transform = currentStep.position === 'top' || currentStep.position === 'bottom' ? 'translateX(-100%)' : transform; }

        return { top, left, transform, maxWidth: '300px' };
    };

    if (!currentStep) return null;

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-auto animate-[fadeIn_0.3s_ease-out]">
            {/* Backdrop Escuro com "Buraco" (Spotlight) simulado via SVG ou Mix-blend (Simplificado aqui com overlay total) */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-500"></div>

            {/* Destaque no elemento (Spotlight Ring) */}
            {coords && (
                <div 
                    className="absolute border-2 border-neon rounded-xl shadow-[0_0_30px_rgba(57,255,20,0.6)] animate-pulse transition-all duration-300 ease-in-out"
                    style={{
                        top: coords.top - 4,
                        left: coords.left - 4,
                        width: coords.width + 8,
                        height: coords.height + 8,
                    }}
                ></div>
            )}

            {/* O Balão (Popover) */}
            <div 
                className={`absolute bg-pitch-900 border border-neon/50 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                style={getPopoverStyle() as React.CSSProperties}
            >
                {/* Arrow indicator logic omitted for simplicity, relying on position */}
                
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-wide">
                        {currentStep.title} <span className="text-neon">.</span>
                    </h3>
                    <button onClick={onSkip} className="text-[10px] text-gray-500 hover:text-white uppercase font-bold">Pular</button>
                </div>

                <p className="text-sm text-gray-300 leading-relaxed">
                    {currentStep.content}
                </p>

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/10">
                    <span className="text-[10px] text-gray-500 font-bold">
                        Passo {currentStepIndex + 1} de {steps.length}
                    </span>
                    
                    <div className="flex gap-2">
                        {currentStepIndex > 0 && (
                            <button 
                                onClick={handlePrev}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition-colors"
                            >
                                Voltar
                            </button>
                        )}
                        <button 
                            onClick={handleNext}
                            className="px-4 py-1.5 rounded-lg bg-neon text-black text-xs font-bold hover:bg-white transition-colors shadow-neon"
                        >
                            {currentStepIndex === steps.length - 1 ? 'Concluir 🚀' : 'Próximo →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};