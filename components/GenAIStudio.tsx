import React, { useState, useRef } from 'react';
import { generateTeamImage, editMatchPhoto } from '../services/geminiService';
import { ImageResolution } from '../types';

export const GenAIStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');
  
  // Generation State
  const [genPrompt, setGenPrompt] = useState('');
  const [resolution, setResolution] = useState<ImageResolution>('1K');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Editing State
  const [editPrompt, setEditPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!genPrompt) return;
    setIsGenerating(true);
    try {
      const result = await generateTeamImage(genPrompt, resolution);
      setGeneratedImage(result);
    } catch (e) {
      alert("Falha ao gerar imagem. Verifique se a API Key é válida.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!sourceImage || !editPrompt) return;
    setIsEditing(true);
    try {
      const result = await editMatchPhoto(sourceImage, editPrompt);
      setEditedImage(result);
    } catch (e) {
      alert("Falha ao editar imagem.");
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-black/80 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden relative">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-4xl font-display font-bold text-white uppercase italic tracking-wide">Estúdio <span className="text-neon">IA</span></h2>
                <p className="text-xs text-gray-500 font-mono">POWERED BY GEMINI 3.0</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center animate-pulse-slow">
                ✨
            </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mb-8">
            <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'create' ? 'bg-pitch-900 text-neon shadow-lg border border-neon/20' : 'text-gray-400 hover:text-white'
            }`}
            >
            GERADOR DE ASSETS
            </button>
            <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'edit' ? 'bg-pitch-900 text-blue-400 shadow-lg border border-blue-500/20' : 'text-gray-400 hover:text-white'
            }`}
            >
            EDITOR DE FOTOS
            </button>
        </div>

        {/* CREATE MODE */}
        {activeTab === 'create' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="space-y-2">
                <label className="text-neon text-xs font-bold uppercase tracking-wider ml-1">Engenharia de Prompt</label>
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-neon to-green-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
                    <textarea
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                    placeholder="Descreva seu logo ou banner dos sonhos..."
                    className="relative w-full bg-black border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon resize-none h-32 font-mono text-sm"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">Qualidade de Saída</label>
                <div className="flex gap-3">
                {(['1K', '2K', '4K'] as ImageResolution[]).map((res) => (
                    <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                        resolution === res
                        ? 'bg-neon/10 border-neon text-neon'
                        : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'
                    }`}
                    >
                    {res}
                    </button>
                ))}
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={isGenerating || !genPrompt}
                className={`w-full py-4 rounded-xl font-display font-bold text-xl tracking-wide uppercase transition-all shadow-lg ${
                isGenerating || !genPrompt
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-neon text-pitch-950 hover:shadow-neon hover:scale-[1.01]'
                }`}
            >
                {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                        Sintetizando...
                    </span>
                ) : 'Gerar Asset'}
            </button>

            {generatedImage && (
                <div className="mt-8 relative rounded-2xl overflow-hidden border border-white/10 group">
                    <div className="absolute top-0 left-0 bg-neon text-black text-[10px] font-bold px-3 py-1 rounded-br-xl z-10">GERADO</div>
                    <img src={generatedImage} alt="Generated Asset" className="w-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6">
                        <button className="bg-white text-black font-bold px-6 py-2 rounded-lg hover:bg-gray-200">Baixar</button>
                    </div>
                </div>
            )}
            </div>
        )}

        {/* EDIT MODE */}
        {activeTab === 'edit' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="space-y-2">
                <label className="text-blue-400 text-xs font-bold uppercase tracking-wider ml-1">Material Fonte</label>
                <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-blue-400/50 transition-colors cursor-pointer bg-white/5" onClick={() => fileInputRef.current?.click()}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    {sourceImage ? (
                        <img src={sourceImage} className="max-h-48 mx-auto rounded-lg shadow-lg" />
                    ) : (
                        <div>
                            <span className="text-2xl block mb-2">📁</span>
                            <span className="text-sm text-gray-400 font-bold">Clique para Enviar Foto do Jogo</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">Instruções Mágicas</label>
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
                    <input
                        type="text"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="ex: Faça parecer um jogo em noite chuvosa..."
                        className="relative w-full bg-black border border-white/10 rounded-xl p-4 pl-12 text-white placeholder-gray-600 focus:outline-none focus:border-blue-400"
                    />
                    <span className="absolute left-4 top-4 text-lg">🪄</span>
                </div>
            </div>

            <button
                onClick={handleEdit}
                disabled={isEditing || !sourceImage || !editPrompt}
                className={`w-full py-4 rounded-xl font-display font-bold text-xl tracking-wide uppercase transition-all shadow-lg ${
                isEditing || !sourceImage || !editPrompt
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                }`}
            >
                {isEditing ? 'Processando Mágica...' : 'Aplicar Edição'}
            </button>

            {editedImage && (
                <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                    <img src={editedImage} alt="Edited Result" className="w-full" />
                </div>
            )}
            </div>
        )}
      </div>
    </div>
  );
};