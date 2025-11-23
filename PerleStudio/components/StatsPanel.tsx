
import React from 'react';
import { BeadType, BraceletSettings, ProjectState } from '../types';
import { ClipboardList, Ruler, ShoppingCart, Minus, Plus } from 'lucide-react';

interface StatsPanelProps {
  project: ProjectState;
  beadTypes: BeadType[];
  settings: BraceletSettings;
  setSettings: (s: BraceletSettings) => void;
  wristSizes: { label: string; value: number }[];
  beadSizes: { label: string; value: number }[];
  onResize: (dim: 'rows' | 'columns', delta: number) => void;
  onSetDimension: (dim: 'rows' | 'columns', value: number) => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ 
  project, beadTypes, settings, setSettings, wristSizes, beadSizes,
  onResize, onSetDimension
}) => {
  
  // Dimensions estimations
  // Miyuki Delica 11/0 is approx 1.6mm wide x 1.3mm high (hole to hole length)
  // But usually settings.beadSizeMm is the 'pitch'
  
  const beadWidth = settings.beadSizeMm;
  const beadHeight = settings.beadSizeMm * 0.85; // Usually height is slightly less than width for seed beads in patterns
  
  const braceletWidthCm = (project.columns * beadWidth) / 10;
  const braceletLengthCm = (project.rows * beadHeight) / 10;
  
  const targetLength = settings.wristSizeCm;

  // Inventory Count
  const inventory: Record<string, number> = {};
  Object.values(project.grid).forEach((val) => {
    const beadId = val as string;
    inventory[beadId] = (inventory[beadId] || 0) + 1;
  });
  const totalBeads = Object.values(inventory).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <ClipboardList size={20} className="text-indigo-600"/>
        Fiche Technique
      </h3>

      <div className="space-y-6 flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {/* Settings */}
        <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Type de Perle</label>
            <select 
              value={settings.beadSizeMm}
              onChange={(e) => setSettings({...settings, beadSizeMm: Number(e.target.value)})}
              className="w-full bg-white border border-slate-200 rounded text-sm p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700"
            >
              {beadSizes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tour de poignet Cible</label>
            <select 
              value={settings.wristSizeCm}
              onChange={(e) => setSettings({...settings, wristSizeCm: Number(e.target.value)})}
              className="w-full bg-white border border-slate-200 rounded text-sm p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700"
            >
              {wristSizes.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Dimensions Control & Display */}
        <div>
           <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Ruler size={16} /> Dimensions & Ajustement
           </h4>
           
           <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Columns Control */}
              <div className="bg-slate-50 p-2 rounded border border-slate-100 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">Largeur (Colonnes)</span>
                  <div className="flex items-center gap-1 mb-1 bg-white border border-slate-200 rounded p-0.5">
                      <button onClick={() => onResize('columns', -1)} className="p-1.5 hover:bg-slate-50 text-slate-500 rounded"><Minus size={14}/></button>
                      <input 
                        type="number" 
                        value={project.columns} 
                        onChange={(e) => onSetDimension('columns', Math.max(1, parseInt(e.target.value) || 1))} 
                        className="w-10 text-center text-sm font-bold outline-none border-none p-0 bg-white text-slate-900 placeholder-slate-400" 
                      />
                      <button onClick={() => onResize('columns', 1)} className="p-1.5 hover:bg-slate-50 text-slate-500 rounded"><Plus size={14}/></button>
                  </div>
                  <div className="text-xs font-bold text-indigo-600 mt-1">{braceletWidthCm.toFixed(1)} cm</div>
              </div>

              {/* Rows Control */}
              <div className="bg-slate-50 p-2 rounded border border-slate-100 flex flex-col items-center relative overflow-hidden">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">Longueur (Rangs)</span>
                  <div className="flex items-center gap-1 mb-1 bg-white border border-slate-200 rounded p-0.5">
                      <button onClick={() => onResize('rows', -1)} className="p-1.5 hover:bg-slate-50 text-slate-500 rounded"><Minus size={14}/></button>
                      <input 
                        type="number" 
                        value={project.rows} 
                        onChange={(e) => onSetDimension('rows', Math.max(1, parseInt(e.target.value) || 1))} 
                        className="w-10 text-center text-sm font-bold outline-none border-none p-0 bg-white text-slate-900 placeholder-slate-400" 
                      />
                      <button onClick={() => onResize('rows', 1)} className="p-1.5 hover:bg-slate-50 text-slate-500 rounded"><Plus size={14}/></button>
                  </div>
                  <div className={`text-xs font-bold mt-1 ${braceletLengthCm < targetLength ? 'text-amber-600' : 'text-green-600'}`}>
                    {braceletLengthCm.toFixed(1)} cm
                  </div>
                  {/* Mini progress bar */}
                  <div className="absolute bottom-0 left-0 h-1 bg-slate-200 w-full">
                     <div className={`h-full ${braceletLengthCm < targetLength ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (braceletLengthCm / targetLength) * 100)}%` }}></div>
                  </div>
              </div>
           </div>
           
           <div className="text-xs text-center bg-indigo-50 text-indigo-800 p-2 rounded border border-indigo-100">
             {braceletLengthCm < targetLength ? (
               <span>Objectif: <strong>{targetLength}cm</strong>. Manque <strong>{(targetLength - braceletLengthCm).toFixed(1)} cm</strong>.</span>
             ) : (
                <span>Longueur atteinte pour {settings.wristSizeCm}cm !</span>
             )}
           </div>
        </div>

        <hr className="border-slate-100" />

        {/* Material List */}
        <div>
           <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
             <ShoppingCart size={16} /> Matériel ({totalBeads} perles)
           </h4>
           {totalBeads === 0 ? (
             <p className="text-xs text-slate-400 italic text-center py-4">Dessinez pour voir le matériel.</p>
           ) : (
             <ul className="space-y-1">
               {Object.entries(inventory).map(([beadId, count]) => {
                 const bead = beadTypes.find(b => b.id === beadId);
                 if (!bead) return null;
                 const grams = (count * 0.005).toFixed(1); // Approx 0.005g per Delica
                 return (
                   <li key={beadId} className="flex justify-between items-center text-xs p-1.5 bg-slate-50 rounded border-l-4 border-slate-200" style={{ borderLeftColor: bead.hex }}>
                     <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">{bead.name}</span>
                     </div>
                     <div className="text-right">
                       <span className="font-bold text-indigo-600 block">{count} p.</span>
                       <span className="text-[10px] text-slate-400">~{grams}g</span>
                     </div>
                   </li>
                 )
               })}
             </ul>
           )}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
