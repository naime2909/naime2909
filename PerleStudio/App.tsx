
import React, { useState, useEffect, useCallback } from 'react';
import { BeadType, BraceletSettings, ProjectState, PatternMode, ToolMode, OverlayImage, PatternGrid, SelectionArea, ClipboardData, MaterialType } from './types';
import { DEFAULT_BEADS, WRIST_SIZES, BEAD_SIZES, EDITOR_CONSTANTS, PRESET_COLORS } from './constants';
import PatternEditor from './components/PatternEditor';
import StatsPanel from './components/StatsPanel';
import VisualPreview from './components/VisualPreview';
import AIGenerator from './components/AIGenerator';
import { Info, Menu, X, Trash2, Eraser, Hand, Sparkles, Undo2, Redo2, Square, Circle, Pencil, Pentagon, CheckSquare, Palette, Grid, ClipboardList, Layout, Image as ImageIcon, Sliders, Crosshair, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move, Layers, ZoomIn, ZoomOut, Scissors, Copy, ClipboardCopy, MousePointer2, Eye, EyeOff, Minus, Plus, Pipette } from 'lucide-react';

const App: React.FC = () => {
  const [activeBeads, setActiveBeads] = useState<BeadType[]>(DEFAULT_BEADS);
  
  // -- History & Project State --
  const [history, setHistory] = useState<ProjectState[]>([{
    mode: 'loom',
    columns: 14,
    rows: 50,
    grid: {}
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Derived current state
  const project = history[historyIndex];

  const [settings, setSettings] = useState<BraceletSettings>({
    wristSizeCm: 16,
    beadSizeMm: 1.6,
  });

  // Tools
  const [selectedBeadId, setSelectedBeadId] = useState<string | null>(DEFAULT_BEADS[0].id);
  const [toolMode, setToolMode] = useState<ToolMode>('pencil');
  const [isFilled, setIsFilled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1); // 0.5 to 3

  // Selection & Clipboard
  const [selection, setSelection] = useState<SelectionArea | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);

  // Overlay State (Image de calque)
  const [overlay, setOverlay] = useState<OverlayImage | null>(null);

  // UI State
  const [showSpecs, setShowSpecs] = useState(false); // Used for modal on desktop, ignored on mobile
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPaletteModal, setShowPaletteModal] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Mobile specific state
  const [mobileTab, setMobileTab] = useState<'editor' | 'specs'>('editor');

  // Custom Color State
  const [customColor, setCustomColor] = useState('#000000');
  const [customName, setCustomName] = useState('Ma Couleur');

  // -- Actions --

  const pushToHistory = (newState: ProjectState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    // Limit history size if needed, e.g., 50 steps
    if (newHistory.length > 50) newHistory.shift();
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            handleUndo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            handleRedo();
        }
        if (e.key === 'Escape') {
            if (toolMode === 'select') setSelection(null);
            if (toolMode === 'paste') setToolMode('select');
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, toolMode]);


  const handleUpdateGrid = (updates: {r: number, c: number, beadId: string | null}[]) => {
    const newGrid = { ...project.grid };
    updates.forEach(({r, c, beadId}) => {
        if (beadId === null) {
            delete newGrid[`${r}-${c}`];
        } else {
            newGrid[`${r}-${c}`] = beadId;
        }
    });
    
    // Only push if changed
    pushToHistory({ ...project, grid: newGrid });
  };

  // --- Copy / Cut / Paste Logic ---

  const getSelectedBeads = (): ClipboardData | null => {
      if (!selection) return null;
      const rMin = Math.min(selection.r1, selection.r2);
      const rMax = Math.max(selection.r1, selection.r2);
      const cMin = Math.min(selection.c1, selection.c2);
      const cMax = Math.max(selection.c1, selection.c2);

      const clipGrid: PatternGrid = {};
      for (let r = rMin; r <= rMax; r++) {
          for (let c = cMin; c <= cMax; c++) {
              const beadId = project.grid[`${r}-${c}`];
              if (beadId) {
                  clipGrid[`${r - rMin}-${c - cMin}`] = beadId;
              }
          }
      }
      return {
          width: cMax - cMin + 1,
          height: rMax - rMin + 1,
          grid: clipGrid
      };
  };

  const handleCopy = () => {
      const data = getSelectedBeads();
      if (data) {
          setClipboard(data);
          setSelection(null); // Clear selection visual
          // Optional: Show toast "Copied"
      }
  };

  const handleCut = () => {
      const data = getSelectedBeads();
      if (data && selection) {
          setClipboard(data);
          
          // Clear beads from grid
          const rMin = Math.min(selection.r1, selection.r2);
          const rMax = Math.max(selection.r1, selection.r2);
          const cMin = Math.min(selection.c1, selection.c2);
          const cMax = Math.max(selection.c1, selection.c2);
          
          const updates = [];
          for (let r = rMin; r <= rMax; r++) {
            for (let c = cMin; c <= cMax; c++) {
                updates.push({r, c, beadId: null});
            }
          }
          handleUpdateGrid(updates);
          setSelection(null);
      }
  };

  const handleDuplicate = () => {
      const data = getSelectedBeads();
      if (data) {
          setClipboard(data);
          setToolMode('paste');
          setSelection(null);
      }
  };

  const handleEnterPasteMode = () => {
      if (clipboard) {
          setToolMode('paste');
      }
  };

  // --- Existing Logic ---

  const handleFillRow = (row: number) => {
    if (toolMode === 'move') return;
    const beadId = toolMode === 'eraser' ? null : selectedBeadId;
    
    const updates = [];
    for (let c = 0; c < project.columns; c++) {
        updates.push({r: row, c, beadId});
    }
    handleUpdateGrid(updates);
  };

  const handleFillCol = (col: number) => {
    if (toolMode === 'move') return;
    const beadId = toolMode === 'eraser' ? null : selectedBeadId;

    const updates = [];
    for (let r = 0; r < project.rows; r++) {
        updates.push({r, c: col, beadId});
    }
    handleUpdateGrid(updates);
  };

  const handleShiftPattern = (direction: 'up' | 'down' | 'left' | 'right') => {
    const newGrid: PatternGrid = {};
    const { rows, columns, grid } = project;

    Object.entries(grid).forEach(([key, beadId]) => {
      const [r, c] = key.split('-').map(Number);
      let newR = r;
      let newC = c;

      switch (direction) {
        case 'up': newR -= 1; break;
        case 'down': newR += 1; break;
        case 'left': newC -= 1; break;
        case 'right': newC += 1; break;
      }

      if (newR >= 0 && newR < rows && newC >= 0 && newC < columns) {
        newGrid[`${newR}-${newC}`] = beadId;
      }
    });

    pushToHistory({ ...project, grid: newGrid });
  };

  const handleResize = (dim: 'rows' | 'columns', delta: number) => {
    pushToHistory({
      ...project,
      [dim]: Math.max(1, project[dim] + delta)
    });
  };

  const handleSetDimension = (dim: 'rows' | 'columns', value: number) => {
    pushToHistory({
      ...project,
      [dim]: Math.max(1, value)
    });
  };

  const handleModeChange = (m: PatternMode) => {
      pushToHistory({ ...project, mode: m });
  }

  const handleAddPalette = (newBeads: BeadType[]) => {
    setActiveBeads(prev => [...prev, ...newBeads]);
    setShowAIModal(false);
  };

  const handleAddPresetToPalette = (preset: {name: string, hex: string, material: MaterialType}) => {
      const newBead: BeadType = {
          id: `p-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          name: preset.name,
          color: preset.hex,
          hex: preset.hex,
          material: preset.material
      };
      setActiveBeads(prev => [...prev, newBead]);
      setSelectedBeadId(newBead.id);
  };

  const handleAddCustomToPalette = () => {
      const newBead: BeadType = {
          id: `c-${Date.now()}`,
          name: customName,
          color: customColor,
          hex: customColor,
          material: MaterialType.GLOSSY // Default
      };
      setActiveBeads(prev => [...prev, newBead]);
      setSelectedBeadId(newBead.id);
  };

  const handleRemoveBead = (beadId: string) => {
      setActiveBeads(prev => prev.filter(b => b.id !== beadId));
      if (selectedBeadId === beadId) {
          setSelectedBeadId(activeBeads[0]?.id || null);
      }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              if (e.target?.result) {
                  const img = new Image();
                  img.onload = () => {
                      setOverlay({
                          id: Date.now().toString(),
                          dataUrl: e.target?.result as string,
                          opacity: 0.5,
                          scale: 1,
                          x: 0,
                          y: 0,
                          width: img.width,
                          height: img.height,
                          layer: 'back'
                      });
                  };
                  img.src = e.target.result as string;
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleCenterOverlay = () => {
      if (!overlay) return;
      const isMobile = window.innerWidth < 640;
      const CONSTS = isMobile ? EDITOR_CONSTANTS.MOBILE : EDITOR_CONSTANTS.DESKTOP;
      
      const gridWidth = project.columns * (CONSTS.CELL_WIDTH * zoomLevel) + (project.mode === 'peyote' ? (CONSTS.CELL_WIDTH * zoomLevel)/2 : 0);
      const gridHeight = project.rows * (CONSTS.CELL_HEIGHT * zoomLevel);
      
      const imgWidth = overlay.width * overlay.scale;
      const imgHeight = overlay.height * overlay.scale;

      setOverlay({
          ...overlay,
          x: (gridWidth - imgWidth) / 2,
          y: (gridHeight - imgHeight) / 2
      });
  };

  return (
    <div className="h-[100dvh] bg-slate-100 text-slate-800 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 z-40 shrink-0 h-14 flex items-center px-4 justify-between shadow-sm">
          <div className="flex items-center gap-2">
            {/* Mobile Menu Toggle */}
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className={`lg:hidden p-2 rounded-lg transition-colors ${isSidebarOpen ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
                title="Menu"
            >
                <Menu size={20} />
            </button>

            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg hidden sm:flex">P</div>
            <h1 className="text-lg font-bold text-slate-800">Perle<span className="text-indigo-600">Studio</span></h1>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
                onClick={() => setShowPreview(!showPreview)} 
                className={`p-2 rounded hover:bg-slate-100 transition-colors hidden sm:flex ${!showPreview ? 'text-indigo-600 bg-indigo-50' : ''}`} 
                title={showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
             >
                 {showPreview ? <Eye size={18}/> : <EyeOff size={18}/>}
             </button>

             <button onClick={handleUndo} disabled={historyIndex === 0} className="p-2 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors" title="Annuler (Ctrl+Z)">
                 <Undo2 size={18}/>
             </button>
             <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-2 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors" title="Rétablir (Ctrl+Y)">
                 <Redo2 size={18}/>
             </button>
             <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block"></div>
             <button onClick={() => setShowSpecs(true)} className="hidden sm:flex items-center gap-1 text-xs font-bold uppercase bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
               <Info size={14} /> Guide
             </button>
          </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        
        {/* SIDEBAR (Unified) */}
        <aside 
            className={`
                fixed inset-y-0 left-0 w-72 bg-white/95 backdrop-blur-sm border-r border-slate-200 flex flex-col z-30 shadow-2xl transition-transform duration-300 transform lg:translate-x-0 lg:relative lg:shadow-none lg:w-72 lg:bg-white
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            <div className="flex justify-between items-center p-4 border-b border-slate-100 lg:hidden">
                <h3 className="font-bold text-slate-800">Outils & Config</h3>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 bg-slate-100 rounded-full">
                    <X size={20}/>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
                
                {/* 1. CONFIGURATION DU BRACELET (Moved from top bar) */}
                <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Configuration</p>
                    
                    {/* Mode Selector */}
                    <div className="flex bg-white border border-slate-200 rounded-lg p-1 mb-3">
                        <button onClick={() => handleModeChange('loom')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${project.mode === 'loom' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Loom</button>
                        <button onClick={() => handleModeChange('peyote')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${project.mode === 'peyote' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Peyote</button>
                    </div>

                    {/* Dimensions REMOVED - Moved to StatsPanel */}
                    <p className="text-[9px] text-slate-400 mt-2 text-center italic">Pour changer la taille, voir "Infos & Matériel".</p>
                </div>

                {/* 2. DRAWING TOOLS SECTION */}
                <div className="p-3 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Dessin</p>
                    <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => setToolMode('pencil')} className={`p-2 rounded-lg flex justify-center items-center transition-all ${toolMode === 'pencil' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`} title="Crayon">
                            <Pencil size={18}/>
                        </button>
                        <button onClick={() => setToolMode('select')} className={`p-2 rounded-lg flex justify-center items-center transition-all ${toolMode === 'select' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`} title="Sélectionner">
                            <MousePointer2 size={18} className="stroke-dashed"/>
                        </button>
                        <button onClick={() => setToolMode('rectangle')} className={`p-2 rounded-lg flex justify-center items-center transition-all ${toolMode === 'rectangle' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`} title="Rectangle">
                            <Square size={18}/>
                        </button>
                        <button onClick={() => setToolMode('circle')} className={`p-2 rounded-lg flex justify-center items-center transition-all ${toolMode === 'circle' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`} title="Cercle">
                            <Circle size={18}/>
                        </button>
                        <button onClick={() => setToolMode('polygon')} className={`p-2 rounded-lg flex justify-center items-center transition-all ${toolMode === 'polygon' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`} title="Polygone">
                            <Pentagon size={18}/>
                        </button>
                        <button onClick={() => setToolMode('move')} className={`p-2 rounded-lg flex justify-center items-center transition-all ${toolMode === 'move' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`} title="Déplacer la vue (Main)">
                            <Hand size={18}/>
                        </button>
                        <button onClick={() => setToolMode('eraser')} className={`p-2 rounded-lg flex justify-center items-center transition-all ${toolMode === 'eraser' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`} title="Gomme">
                            <Eraser size={18}/>
                        </button>
                    </div>

                    {/* Option Remplissage Formes */}
                    {(toolMode === 'rectangle' || toolMode === 'circle' || toolMode === 'polygon') && (
                    <div className="mt-3 bg-slate-50 p-2 rounded border border-slate-100">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                            <input 
                            type="checkbox" 
                            checked={isFilled} 
                            onChange={(e) => setIsFilled(e.target.checked)} 
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Remplir forme</span>
                        </label>
                    </div>
                    )}
                </div>

                {/* 3. CLIPBOARD PASTE BUTTON */}
                {clipboard && toolMode !== 'select' && toolMode !== 'paste' && (
                    <div className="p-3 border-b border-slate-100">
                        <button onClick={handleEnterPasteMode} className="w-full flex items-center justify-center gap-2 p-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-xs font-bold hover:bg-indigo-100">
                            <ClipboardList size={14}/> Coller ({clipboard.width}x{clipboard.height})
                        </button>
                    </div>
                )}

                {/* 4. PATTERN SHIFT SECTION */}
                <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Move size={10}/> Déplacer le motif (Perles)</p>
                    <div className="flex flex-col items-center gap-1">
                        <button onClick={() => handleShiftPattern('up')} className="p-1.5 bg-white shadow-sm rounded hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200"><ArrowUp size={16} /></button>
                        <div className="flex gap-2">
                        <button onClick={() => handleShiftPattern('left')} className="p-1.5 bg-white shadow-sm rounded hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200"><ArrowLeft size={16} /></button>
                        <div className="w-8 h-8 flex items-center justify-center text-slate-400 bg-slate-100 rounded-full text-[10px] font-bold">POS</div>
                        <button onClick={() => handleShiftPattern('right')} className="p-1.5 bg-white shadow-sm rounded hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200"><ArrowRight size={16} /></button>
                        </div>
                        <button onClick={() => handleShiftPattern('down')} className="p-1.5 bg-white shadow-sm rounded hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200"><ArrowDown size={16} /></button>
                    </div>
                </div>

                {/* 5. OVERLAY SECTION */}
                <div className="p-3 pb-20 lg:pb-3 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Calque / Modèle</p>
                    {!overlay ? (
                        <label className="flex items-center justify-center gap-2 p-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                            <ImageIcon size={18} className="text-slate-400"/>
                            <span className="text-xs text-slate-500">Importer une image</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden"/>
                        </label>
                    ) : (
                        <div className="space-y-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1"><Sliders size={12}/> Réglages</span>
                                <button onClick={() => setOverlay(null)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>Opacité</span>
                                    <span>{Math.round(overlay.opacity * 100)}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.05" 
                                    value={overlay.opacity}
                                    onChange={(e) => setOverlay({...overlay, opacity: parseFloat(e.target.value)})}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>Taille (Zoom)</span>
                                    <span>x{overlay.scale.toFixed(1)}</span>
                                </div>
                                <input 
                                    type="range" min="0.1" max="5" step="0.1" 
                                    value={overlay.scale}
                                    onChange={(e) => setOverlay({...overlay, scale: parseFloat(e.target.value)})}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-[10px] text-slate-500 block mb-1">Pos X</span>
                                    <input 
                                        type="number" 
                                        value={Math.round(overlay.x)} 
                                        onChange={(e) => setOverlay({...overlay, x: parseInt(e.target.value)})}
                                        className="w-full text-xs p-1 border border-slate-200 rounded"
                                    />
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 block mb-1">Pos Y</span>
                                    <input 
                                        type="number" 
                                        value={Math.round(overlay.y)} 
                                        onChange={(e) => setOverlay({...overlay, y: parseInt(e.target.value)})}
                                        className="w-full text-xs p-1 border border-slate-200 rounded"
                                    />
                                </div>
                            </div>
                            
                            {/* Layer Toggle */}
                            <div className="bg-slate-200 p-1 rounded flex">
                                <button 
                                    onClick={() => setOverlay({...overlay, layer: 'back'})}
                                    className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${overlay.layer === 'back' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Dessous
                                </button>
                                <button 
                                    onClick={() => setOverlay({...overlay, layer: 'front'})}
                                    className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${overlay.layer === 'front' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Dessus
                                </button>
                            </div>

                            <button 
                                onClick={handleCenterOverlay}
                                className="w-full flex items-center justify-center gap-1 p-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded hover:bg-indigo-100 transition-colors"
                            >
                                <Crosshair size={14} /> Centrer l'image
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>

        {/* CENTER CONTENT */}
        <main className="flex-1 relative flex flex-col min-w-0 min-h-0 bg-slate-200/50">
            
            {/* Mobile Tab View Switching Logic */}
            <div className={`flex-1 flex flex-col min-h-0 ${mobileTab === 'specs' ? 'hidden lg:flex' : 'flex'}`}>
                {/* TOP: Visual Preview (Horizontal Strip) - Conditional Render */}
                {showPreview && (
                    <div className="h-28 sm:h-48 shrink-0 p-2 sm:p-3 bg-slate-100/50 border-b border-slate-200 z-10 relative group">
                        <VisualPreview project={project} beadTypes={activeBeads} orientation="horizontal" />
                        <button 
                            onClick={() => setShowPreview(false)}
                            className="absolute top-4 right-4 p-1.5 bg-white/80 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity lg:hidden"
                            title="Masquer l'aperçu"
                        >
                            <X size={14} className="text-slate-500"/>
                        </button>
                    </div>
                )}

                {/* BOTTOM: Editor */}
                <div className="flex-1 relative min-h-0 flex flex-col">
                    {/* Zoom Bar */}
                    <div className="h-10 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4">
                         <div className="flex items-center gap-4">
                             <div className="flex items-center gap-1 bg-slate-100 rounded-md p-1">
                                 <button onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))} className="p-1 hover:bg-white rounded text-slate-500"><ZoomOut size={16}/></button>
                                 <span className="text-xs font-bold w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                                 <button onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))} className="p-1 hover:bg-white rounded text-slate-500"><ZoomIn size={16}/></button>
                             </div>
                             {toolMode === 'paste' && <span className="text-xs text-indigo-600 font-bold animate-pulse">Mode Coller activé - Cliquez pour déposer</span>}
                         </div>

                         {/* Mobile Preview Toggle (in Zoom bar if preview hidden) */}
                         {!showPreview && (
                             <button onClick={() => setShowPreview(true)} className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded lg:hidden">
                                 <Eye size={14}/> Voir Aperçu
                             </button>
                         )}
                    </div>

                    {/* --- HORIZONTAL PALETTE BAR --- */}
                    <div className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center px-4 overflow-x-auto gap-3 scrollbar-thin">
                        <div className="flex items-center justify-center shrink-0 border-r border-slate-100 pr-3">
                           <button onClick={() => setShowAIModal(true)} className="flex flex-col items-center gap-0.5 text-[9px] font-bold text-slate-500 hover:text-indigo-600">
                               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-sm">
                                   <Sparkles size={16}/>
                               </div>
                               <span>IA</span>
                           </button>
                        </div>
                        
                        {activeBeads.map(bead => (
                            <button 
                                key={bead.id}
                                onClick={() => { 
                                    setSelectedBeadId(bead.id); 
                                    if(toolMode === 'eraser' || toolMode === 'move' || toolMode === 'select') setToolMode('pencil');
                                }}
                                className={`shrink-0 flex flex-col items-center gap-1 group relative outline-none`}
                                onContextMenu={(e) => { e.preventDefault(); handleRemoveBead(bead.id); }}
                            >
                                <div className={`w-8 h-8 rounded-full border shadow-sm relative transition-transform ${selectedBeadId === bead.id ? 'scale-110 ring-2 ring-indigo-500 border-white' : 'border-slate-100 hover:scale-105'}`} style={{ backgroundColor: bead.hex }}>
                                    {bead.material === 'Brillant' && <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-40"></div>}
                                    {selectedBeadId === bead.id && (
                                        <div className="absolute inset-0 rounded-full border-2 border-white"></div>
                                    )}
                                </div>
                                <span className={`text-[9px] max-w-[60px] truncate ${selectedBeadId === bead.id ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                                    {bead.name}
                                </span>
                            </button>
                        ))}
                        
                        <button onClick={() => setShowPaletteModal(true)} className="shrink-0 w-8 h-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors" title="Gérer les couleurs">
                            <Plus size={16}/>
                        </button>
                    </div>

                    <div className="flex-1 relative min-h-0">
                        <PatternEditor 
                            mode={project.mode}
                            columns={project.columns}
                            rows={project.rows}
                            grid={project.grid}
                            beadTypes={activeBeads}
                            selectedBeadId={selectedBeadId}
                            toolMode={toolMode}
                            isFilled={isFilled}
                            overlay={overlay}
                            onUpdateGrid={handleUpdateGrid}
                            onFillRow={handleFillRow}
                            onFillCol={handleFillCol}
                            zoomLevel={zoomLevel}
                            selection={selection}
                            onSelectionChange={setSelection}
                            clipboard={clipboard}
                            onPaste={(pos) => {
                                if (clipboard) {
                                    const centerR = Math.floor(clipboard.height / 2);
                                    const centerC = Math.floor(clipboard.width / 2);

                                    const updates = [];
                                    Object.entries(clipboard.grid).forEach(([key, beadId]) => {
                                        const [dr, dc] = key.split('-').map(Number);
                                        const targetR = pos.r - centerR + dr;
                                        const targetC = pos.c - centerC + dc;
                                        
                                        if (targetR >= 0 && targetR < project.rows && targetC >= 0 && targetC < project.columns) {
                                            updates.push({r: targetR, c: targetC, beadId});
                                        }
                                    });
                                    handleUpdateGrid(updates);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* RIGHT: INFO PANEL */}
            <div className={`lg:hidden flex-1 p-4 overflow-y-auto bg-white ${mobileTab === 'specs' ? 'block' : 'hidden'}`}>
                <StatsPanel 
                    project={project}
                    beadTypes={activeBeads}
                    settings={settings}
                    setSettings={setSettings}
                    wristSizes={WRIST_SIZES}
                    beadSizes={BEAD_SIZES}
                    onResize={handleResize}
                    onSetDimension={handleSetDimension}
                />
            </div>
            
        </main>

        {/* RIGHT: INFO PANEL (DESKTOP) */}
        <aside className="hidden lg:flex w-80 bg-white border-l border-slate-200 flex-col shrink-0 z-20 shadow-lg">
             <div className="flex-1 overflow-hidden">
                <StatsPanel 
                    project={project}
                    beadTypes={activeBeads}
                    settings={settings}
                    setSettings={setSettings}
                    wristSizes={WRIST_SIZES}
                    beadSizes={BEAD_SIZES}
                    onResize={handleResize}
                    onSetDimension={handleSetDimension}
                />
             </div>
        </aside>

      </div>

      {/* Floating Action Bar for SELECTION (Bottom Center) */}
      {toolMode === 'select' && selection && (
        <div className="fixed bottom-[70px] left-4 right-4 md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-96 bg-white shadow-2xl rounded-xl p-3 border border-indigo-100 flex flex-col gap-2 z-50 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-1">
                <span className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1"><MousePointer2 size={12}/> Zone Sélectionnée</span>
                <button onClick={() => setSelection(null)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>
            <div className="flex gap-2">
                <button onClick={handleCopy} className="flex-1 flex flex-col items-center justify-center p-2 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 text-indigo-700 transition-colors">
                    <Copy size={18} /> <span className="text-[10px] font-bold mt-1">Copier</span>
                </button>
                <button onClick={handleCut} className="flex-1 flex flex-col items-center justify-center p-2 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 text-indigo-700 transition-colors">
                    <Scissors size={18} /> <span className="text-[10px] font-bold mt-1">Couper</span>
                </button>
                <button onClick={handleDuplicate} className="flex-1 flex flex-col items-center justify-center p-2 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 text-indigo-700 transition-colors">
                    <ClipboardCopy size={18} /> <span className="text-[10px] font-bold mt-1">Dupliquer</span>
                </button>
            </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      <div className="lg:hidden bg-white border-t border-slate-200 flex justify-around p-2 shrink-0 z-40">
         <button 
           onClick={() => setMobileTab('editor')}
           className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full ${mobileTab === 'editor' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}
         >
            <Grid size={20} />
            <span className="text-[10px] font-bold">Éditeur</span>
         </button>
         <button 
           onClick={() => setMobileTab('specs')}
           className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full ${mobileTab === 'specs' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}
         >
            <ClipboardList size={20} />
            <span className="text-[10px] font-bold">Infos & Matériel</span>
         </button>
      </div>

      {/* PALETTE MANAGER MODAL (NEW) */}
      {showPaletteModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b border-slate-100">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                          <Palette size={20} className="text-indigo-600"/> Gestion des Couleurs
                      </h3>
                      <button onClick={() => setShowPaletteModal(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                          <X size={20}/>
                      </button>
                  </div>
                  
                  <div className="p-4 overflow-y-auto space-y-6">
                      
                      {/* Section 1: Ma Palette */}
                      <div>
                          <h4 className="text-sm font-bold text-slate-700 uppercase mb-3">Ma Palette Actuelle ({activeBeads.length})</h4>
                          <div className="flex flex-wrap gap-2">
                              {activeBeads.map(bead => (
                                  <div key={bead.id} className="group relative flex flex-col items-center p-2 rounded border border-slate-100 bg-slate-50 hover:border-slate-300 w-20">
                                      <div className="w-8 h-8 rounded-full shadow-sm border border-white mb-1" style={{backgroundColor: bead.hex}}></div>
                                      <span className="text-[9px] text-center text-slate-600 leading-tight line-clamp-2 w-full">{bead.name}</span>
                                      <button 
                                        onClick={() => handleRemoveBead(bead.id)}
                                        className="absolute -top-1 -right-1 bg-white text-red-500 rounded-full shadow border border-slate-200 p-0.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                          <X size={12}/>
                                      </button>
                                  </div>
                              ))}
                              {activeBeads.length === 0 && <p className="text-sm text-slate-400 italic">Votre palette est vide.</p>}
                          </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Section 2: Catalogue */}
                      <div>
                          <h4 className="text-sm font-bold text-slate-700 uppercase mb-3">Catalogue de Perles</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {PRESET_COLORS.map((color, idx) => (
                                  <button 
                                    key={idx}
                                    onClick={() => handleAddPresetToPalette(color)}
                                    className="flex items-center gap-2 p-2 rounded border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-left"
                                  >
                                      <div className="w-6 h-6 rounded-full border border-black/10 shrink-0" style={{backgroundColor: color.hex}}></div>
                                      <div className="min-w-0">
                                          <p className="text-xs font-semibold text-slate-700 truncate">{color.name}</p>
                                          <p className="text-[10px] text-slate-400">{color.material}</p>
                                      </div>
                                  </button>
                              ))}
                          </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Section 3: Custom Color */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
                          <div className="flex-1 w-full">
                              <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">Couleur sur mesure</h4>
                              <div className="flex gap-2 mb-2">
                                  <input 
                                    type="text" 
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    className="flex-1 text-sm border border-slate-200 rounded px-2 py-1"
                                    placeholder="Nom de la couleur"
                                  />
                                  <input 
                                    type="color" 
                                    value={customColor} 
                                    onChange={(e) => setCustomColor(e.target.value)}
                                    className="w-10 h-8 rounded cursor-pointer border-none bg-transparent"
                                  />
                              </div>
                              <button 
                                onClick={handleAddCustomToPalette}
                                className="w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded hover:bg-indigo-700 transition-colors"
                              >
                                  Ajouter cette couleur
                              </button>
                          </div>
                          <div className="w-px h-20 bg-slate-200 hidden sm:block"></div>
                          <div className="flex-1 w-full flex flex-col justify-center">
                              <p className="text-xs text-slate-500 mb-2">Besoin d'inspiration ?</p>
                              <button 
                                onClick={() => { setShowPaletteModal(false); setShowAIModal(true); }}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded text-xs font-bold hover:opacity-90 transition-opacity"
                              >
                                  <Sparkles size={14}/> Utiliser l'Assistant IA
                              </button>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
      )}

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                <div className="flex justify-between items-center p-4 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Sparkles size={20} className="text-indigo-600"/> Assistant Créatif
                    </h3>
                    <button onClick={() => setShowAIModal(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                        <X size={20}/>
                    </button>
                </div>
                <div className="p-4">
                    <AIGenerator onAddBeadsToPalette={handleAddPalette} />
                </div>
            </div>
        </div>
      )}

      {/* Spec Modal (Desktop Guide) */}
      {showSpecs && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">Guide d'utilisation</h2>
                <button onClick={() => setShowSpecs(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="prose prose-sm text-slate-600 space-y-4">
                 <p>Bienvenue dans votre atelier de tissage de perles !</p>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="border border-slate-200 p-3 rounded-lg">
                     <h4 className="font-bold text-slate-800 mb-2">Outils & Formes</h4>
                     <ul className="list-disc pl-4 space-y-1">
                       <li><strong>Sélection :</strong> Encadrez une zone pour Copier/Couper/Dupliquer.</li>
                       <li><strong>Crayon :</strong> Dessin point par point.</li>
                       <li><strong>Carré / Cercle :</strong> Choisissez une couleur, puis cliquez et glissez.</li>
                       <li><strong>Main :</strong> Déplacez la vue (ou utilisez les barres de défilement).</li>
                       <li><strong>Zoom :</strong> Utilisez les loupes en haut de l'éditeur.</li>
                     </ul>
                   </div>
                   <div className="border border-slate-200 p-3 rounded-lg">
                     <h4 className="font-bold text-slate-800 mb-2">Raccourcis</h4>
                     <ul className="list-disc pl-4 space-y-1">
                       <li><strong>Ctrl + Z :</strong> Annuler.</li>
                       <li><strong>Ctrl + Y :</strong> Rétablir.</li>
                       <li><strong>Échap :</strong> Annuler sélection ou mode coller.</li>
                     </ul>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
