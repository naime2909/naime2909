import React, { useState } from 'react';
import { Sparkles, Loader2, PlusCircle } from 'lucide-react';
import { generateBeadPalette } from '../services/geminiService';
import { AIResponseSchema, BeadType, MaterialType } from '../types';

interface AIGeneratorProps {
  onAddBeadsToPalette: (newBeads: BeadType[]) => void;
}

const AIGenerator: React.FC<AIGeneratorProps> = ({ onAddBeadsToPalette }) => {
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponseSchema | null>(null);

  const handleGenerate = async () => {
    if (!theme.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
        const data = await generateBeadPalette(theme);
        setResult(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleApplyPalette = () => {
    if (!result) return;
    
    const newBeads: BeadType[] = result.colors.map((c, idx) => ({
        id: `ai-${Date.now()}-${idx}`,
        name: c.name,
        hex: c.hex,
        color: c.hex, // fallback
        material: mapSuggestionToMaterial(c.suggestion),
    }));

    onAddBeadsToPalette(newBeads);
    setResult(null);
    setTheme('');
  };

  const mapSuggestionToMaterial = (suggestion: string): MaterialType => {
      const lower = suggestion.toLowerCase();
      if (lower.includes('bo')) return MaterialType.WOOD;
      if (lower.includes('cr') || lower.includes('tr')) return MaterialType.CRYSTAL;
      if (lower.includes('ma')) return MaterialType.MATTE;
      if (lower.includes('mé')) return MaterialType.METAL;
      return MaterialType.GLOSSY;
  };

  return (
    <div className="w-full">
      <p className="text-sm text-slate-600 mb-4">
        Entrez un thème (ex: "Coucher de soleil", "Fleurs de cerisier", "Cyberpunk") et l'IA générera une palette de perles assortie.
      </p>

      <div className="flex gap-2 mb-6">
        <input 
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Décrivez votre inspiration..."
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button 
            onClick={handleGenerate}
            disabled={loading || !theme.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
        >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            <span>Générer</span>
        </button>
      </div>

      {result && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 animate-fade-in">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-bold text-slate-800">{result.paletteName}</h4>
                    <p className="text-xs text-slate-500">{result.description}</p>
                </div>
                <button 
                    onClick={handleApplyPalette}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors font-bold flex items-center gap-1 shadow-sm"
                >
                    <PlusCircle size={14}/> Utiliser
                </button>
            </div>
            
            <div className="flex flex-wrap gap-3">
                {result.colors.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 group relative">
                        <div 
                            className="w-12 h-12 rounded-full shadow-sm border border-white ring-1 ring-slate-100" 
                            style={{ backgroundColor: c.hex }}
                        ></div>
                        <span className="text-[10px] text-slate-500 max-w-[60px] text-center truncate font-medium">{c.name}</span>
                        <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                            {c.suggestion}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default AIGenerator;