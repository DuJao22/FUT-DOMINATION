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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const currentStep = steps[currentStepIndex];

    // Detectar resize para atualizar isMobile
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                // Scroll suave até o elemento se necessário, com margem
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            } else {
                // Se o elemento não existe na tela atual
                setCoords(null); 
                setIsVisible(true);
            }
        };

        const timer = setTimeout(updatePosition, 300);
        window.addEventListener('resize', updatePosition);
        // Também atualizar ao rolar
        window.addEventListener('scroll', updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
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
        // MOBILE STRATEGY: Sempre fixo embaixo (Bottom Sheet style) se não for 'center'
        if (isMobile && currentStep.position !== 'center') {
            return {
                position: 'fixed',
                bottom: '24px',
                left: '16px',
                right: '16px',
                width: 'auto',
                margin: '0 auto',
                maxWidth: '400px',
                transform: 'none', // Remove transformações de centralização
                zIndex: 10000
            };
        }

        // DESKTOP OU CENTER STRATEGY
        if (!coords || currentStep.position === 'center') {
            return {
                position: 'fixed', // Center usa fixed para garantir meio da tela
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '90vw',
                width: '400px',
                zIndex: 10000
            };
        }

        const gap = 15;
        let top = 0;
        let left = 0;
        let transform = '';

        // Lógica Desktop (posiciona ao lado do elemento)
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
            default:
                top = coords.top + coords.height + gap;
                left = coords.left + (coords.width / 2);
                transform = 'translateX(-50%)';
        }

        // Boundary Checks básicos para Desktop
        const screenW = window.innerWidth;
        // Evita sair na esquerda
        if (left < 150) { 
            left = coords.left; 
            transform = transform.replace('translateX(-50%)', 'translateX(0)'); 
        }
        // Evita sair na direita
        if (left > screenW - 150) { 
            left = coords.left + coords.width; 
            transform = transform.replace('translateX(-50%)', 'translateX(-100%)'); 
        }

        return { 
            position: 'absolute', // Desktop usa absolute baseado no scroll
            top, 
            left, 
            transform, 
            maxWidth: '320px',
            zIndex: 10000
        };
    };

    if (!currentStep) return null;

    const popoverStyle = getPopoverStyle() as React.CSSProperties;

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-auto animate-[fadeIn_0.3s_ease-out]">
            {/* Backdrop Escuro */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500"></div>

            {/* Destaque no elemento (Spotlight Ring) - Absoluto na página */}
            {coords && (
                <div 
                    className="absolute border-2 border-neon rounded-xl shadow-[0_0_30px_rgba(57,255,20,0.6)] animate-pulse transition-all duration-300 ease-in-out z-[9999]"
                    style={{
                        top: coords.top - 4,
                        left: coords.left - 4,
                        width: coords.width + 8,
                        height: coords.height + 8,
                    }}
                >
                    {/* Linha conectora no mobile (opcional visual cue) */}
                    {isMobile && currentStep.position !== 'center' && (
                        <div className="absolute left-1/2 top-full h-[100vh] w-0.5 border-l border-dashed border-neon/30 -translate-x-1/2"></div>
                    )}
                </div>
            )}

            {/* O Balão (Popover) */}
            <div 
                className={`bg-pitch-900 border border-neon/50 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                style={popoverStyle}
            >
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-wide">
                        {currentStep.title} <span className="text-neon">.</span>
                    </h3>
                    <button onClick={onSkip} className="text-[10px] text-gray-500 hover:text-white uppercase font-bold p-1">Pular</button>
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
                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition-colors"
                            >
                                Voltar
                            </button>
                        )}
                        <button 
                            onClick={handleNext}
                            className="px-6 py-2 rounded-lg bg-neon text-black text-xs font-bold hover:bg-white transition-colors shadow-neon"
                        >
                            {currentStepIndex === steps.length - 1 ? 'Concluir 🚀' : 'Próximo →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};