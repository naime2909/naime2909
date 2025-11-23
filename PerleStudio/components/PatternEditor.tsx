
import React, { useRef, useState, useEffect } from 'react';
import { BeadType, PatternGrid, PatternMode, ToolMode, OverlayImage, SelectionArea, ClipboardData } from '../types';
import BeadRenderer from './BeadRenderer';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { EDITOR_CONSTANTS } from '../constants';

interface PatternEditorProps {
  mode: PatternMode;
  columns: number;
  rows: number;
  grid: PatternGrid;
  beadTypes: BeadType[];
  selectedBeadId: string | null;
  toolMode: ToolMode;
  isFilled?: boolean;
  overlay: OverlayImage | null;
  zoomLevel: number; // 1 = 100%
  selection?: SelectionArea | null;
  onSelectionChange?: (sel: SelectionArea | null) => void;
  clipboard?: ClipboardData | null;
  onPaste?: (pos: {r: number, c: number}) => void;
  onUpdateGrid: (updates: {r: number, c: number, beadId: string | null}[]) => void;
  onFillRow: (row: number) => void;
  onFillCol: (col: number) => void;
}

const PatternEditor: React.FC<PatternEditorProps> = ({ 
  mode, columns, rows, grid, beadTypes, selectedBeadId, toolMode, isFilled = true, overlay, zoomLevel = 1,
  selection, onSelectionChange, clipboard, onPaste,
  onUpdateGrid, onFillRow, onFillCol
}) => {
  // State for dragging shapes (Rectangle, Circle, Select)
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{r: number, c: number} | null>(null);
  const [currentPos, setCurrentPos] = useState<{r: number, c: number} | null>(null);
  
  // State for Polygon tool
  const [polygonPoints, setPolygonPoints] = useState<{r: number, c: number}[]>([]);

  // State for panning (Move tool)
  const [isPanning, setIsPanning] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Responsive Cell Sizes
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use shared constants multiplied by Zoom
  const CONSTS = isMobile ? EDITOR_CONSTANTS.MOBILE : EDITOR_CONSTANTS.DESKTOP;
  const CELL_WIDTH = CONSTS.CELL_WIDTH * zoomLevel;
  const CELL_HEIGHT = CONSTS.CELL_HEIGHT * zoomLevel;
  const HEADER_SIZE = CONSTS.HEADER_SIZE;
  
  const FONT_SIZE_CLASS = isMobile ? 'text-[8px]' : 'text-[10px]';

  // Reset polygon points when tool changes
  useEffect(() => {
    if (toolMode !== 'polygon') {
        setPolygonPoints([]);
    }
  }, [toolMode]);

  // --- Outils de Pan (Main) ---
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (toolMode === 'move' && scrollContainerRef.current) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop
      });
      e.preventDefault(); 
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (isPanning && scrollContainerRef.current && toolMode === 'move') {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      scrollContainerRef.current.scrollLeft = panStart.scrollLeft - dx;
      scrollContainerRef.current.scrollTop = panStart.scrollTop - dy;
    }
  };

  // --- Algorithmes de Formes ---

  const getLinePixels = (r1: number, c1: number, r2: number, c2: number): {r: number, c: number}[] => {
      const pixels: {r: number, c: number}[] = [];
      let r = r1;
      let c = c1;
      const dr = Math.abs(r2 - r1);
      const dc = Math.abs(c2 - c1);
      const sr = r1 < r2 ? 1 : -1;
      const sc = c1 < c2 ? 1 : -1;
      let err = (dr > dc ? dr : -dc) / 2;
      let e2;

      while (true) {
          pixels.push({r, c});
          if (r === r2 && c === c2) break;
          e2 = err;
          if (e2 > -dr) { err -= dc; r += sr; }
          if (e2 < dc) { err += dr; c += sc; }
      }
      return pixels;
  };

  const getPolygonPixels = (points: {r: number, c: number}[], filled: boolean): {r: number, c: number}[] => {
      if (points.length < 2) return [];
      
      const pixels: {r: number, c: number}[] = [];
      const pixelSet = new Set<string>();

      // 1. Draw outline
      for (let i = 0; i < points.length; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % points.length];
          const line = getLinePixels(p1.r, p1.c, p2.r, p2.c);
          line.forEach(p => {
              const key = `${p.r}-${p.c}`;
              if (!pixelSet.has(key)) {
                  pixelSet.add(key);
                  pixels.push(p);
              }
          });
      }

      // 2. Fill logic
      if (filled && points.length > 2) {
          let minR = points[0].r, maxR = points[0].r;
          let minC = points[0].c, maxC = points[0].c;
          points.forEach(p => {
              if (p.r < minR) minR = p.r;
              if (p.r > maxR) maxR = p.r;
              if (p.c < minC) minC = p.c;
              if (p.c > maxC) maxC = p.c;
          });

          for (let r = minR; r <= maxR; r++) {
              for (let c = minC; c <= maxC; c++) {
                  if (pixelSet.has(`${r}-${c}`)) continue; 

                  let inside = false;
                  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                      const xi = points[i].c, yi = points[i].r;
                      const xj = points[j].c, yj = points[j].r;
                      
                      const intersect = ((yi > r) !== (yj > r))
                          && (c < (xj - xi) * (r - yi) / (yj - yi) + xi);
                      if (intersect) inside = !inside;
                  }
                  
                  if (inside) {
                      pixels.push({r, c});
                  }
              }
          }
      }
      return pixels;
  };

  const getShapePixels = (r1: number, c1: number, r2: number, c2: number, shape: 'rectangle' | 'circle', filled: boolean): {r: number, c: number}[] => {
      const pixels: {r: number, c: number}[] = [];
      const minR = Math.min(r1, r2);
      const maxR = Math.max(r1, r2);
      const minC = Math.min(c1, c2);
      const maxC = Math.max(c1, c2);

      if (shape === 'rectangle') {
          for (let r = minR; r <= maxR; r++) {
              for (let c = minC; c <= maxC; c++) {
                  if (filled || r === minR || r === maxR || c === minC || c === maxC) {
                      pixels.push({r, c});
                  }
              }
          }
      } else if (shape === 'circle') {
          const centerR = (r1 + r2) / 2;
          const centerC = (c1 + c2) / 2;
          const radiusR = Math.max(0.5, Math.abs(r1 - r2) / 2);
          const radiusC = Math.max(0.5, Math.abs(c1 - c2) / 2);

          for (let r = minR; r <= maxR; r++) {
              for (let c = minC; c <= maxC; c++) {
                  const dr = (r - centerR) / radiusR;
                  const dc = (c - centerC) / radiusC;
                  const distSq = dr*dr + dc*dc;
                  
                  if (distSq <= 1.2) { 
                      if (filled) {
                          pixels.push({r, c});
                      } else {
                          if (distSq >= 0.7) { 
                              pixels.push({r, c});
                          }
                      }
                  }
              }
          }
      }
      return pixels;
  };

  // --- Handlers ---

  const handleCellMouseDown = (e: React.MouseEvent, r: number, c: number) => {
    if (toolMode === 'move') return;
    e.stopPropagation();

    // Paste Logic
    if (toolMode === 'paste') {
        if (onPaste) onPaste({r, c});
        return;
    }

    // Polygon Logic
    if (toolMode === 'polygon') {
        if (polygonPoints.length > 2 && polygonPoints[0].r === r && polygonPoints[0].c === c) {
            const pixels = getPolygonPixels(polygonPoints, isFilled);
            const updates = pixels.map(p => ({
                r: p.r, c: p.c, beadId: selectedBeadId
            }));
            onUpdateGrid(updates);
            setPolygonPoints([]);
            return;
        }
        setPolygonPoints([...polygonPoints, {r, c}]);
        return;
    }

    // Drag Logic
    setIsDragging(true);
    setStartPos({r, c});
    setCurrentPos({r, c});
    
    // Clear selection if starting a new one
    if (toolMode === 'select' && onSelectionChange) {
        onSelectionChange({r1: r, c1: c, r2: r, c2: c});
    }

    // Direct paint
    if (toolMode === 'pencil' || toolMode === 'eraser') {
       const bId = toolMode === 'eraser' ? null : selectedBeadId;
       onUpdateGrid([{r, c, beadId: bId}]);
    }
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    // Paste Preview
    if (toolMode === 'paste') {
        setCurrentPos({r, c});
        return;
    }

    // Polygon rubberband
    if (toolMode === 'polygon') {
        setCurrentPos({r, c});
        return;
    }

    if (!isDragging) return;
    setCurrentPos({r, c});

    // Update selection drag
    if (toolMode === 'select' && startPos && onSelectionChange) {
        onSelectionChange({r1: startPos.r, c1: startPos.c, r2: r, c2: c});
    }

    // Direct Paint drag
    if (toolMode === 'pencil' || toolMode === 'eraser') {
        const bId = toolMode === 'eraser' ? null : selectedBeadId;
        onUpdateGrid([{r, c, beadId: bId}]);
    }
  };

  const handleGlobalMouseUp = () => {
    if (isDragging) {
        if ((toolMode === 'rectangle' || toolMode === 'circle') && startPos && currentPos) {
            const pixels = getShapePixels(startPos.r, startPos.c, currentPos.r, currentPos.c, toolMode, isFilled);
            const updates = pixels.map(p => ({
                r: p.r,
                c: p.c,
                beadId: selectedBeadId
            }));
            onUpdateGrid(updates);
        }
    }
    setIsDragging(false);
    setIsPanning(false);
    setStartPos(null);
    if (toolMode !== 'polygon' && toolMode !== 'paste') setCurrentPos(null);
  };

  // --- Rendering Ghosts & Selection ---
  
  let ghostPixels: Set<string> = new Set();
  
  // Ghost for Rectangle/Circle
  if (isDragging && startPos && currentPos && (toolMode === 'rectangle' || toolMode === 'circle')) {
      const pixels = getShapePixels(startPos.r, startPos.c, currentPos.r, currentPos.c, toolMode, isFilled);
      pixels.forEach(p => ghostPixels.add(`${p.r}-${p.c}`));
  }

  // Ghost for Polygon
  if (toolMode === 'polygon' && polygonPoints.length > 0) {
      for (let i = 0; i < polygonPoints.length - 1; i++) {
          const p1 = polygonPoints[i];
          const p2 = polygonPoints[i+1];
          getLinePixels(p1.r, p1.c, p2.r, p2.c).forEach(p => ghostPixels.add(`${p.r}-${p.c}`));
      }
      if (currentPos) {
          const lastP = polygonPoints[polygonPoints.length - 1];
          getLinePixels(lastP.r, lastP.c, currentPos.r, currentPos.c).forEach(p => ghostPixels.add(`${p.r}-${p.c}`));
      }
      polygonPoints.forEach(p => ghostPixels.add(`${p.r}-${p.c}`));
  }

  // Grid Dimensions
  const gridContentWidth = columns * CELL_WIDTH + (mode === 'peyote' ? CELL_WIDTH/2 : 0);
  const gridContentHeight = rows * CELL_HEIGHT;

  return (
    <div 
      className="flex flex-col h-full bg-slate-50 relative" 
      onMouseUp={handleGlobalMouseUp} 
      onMouseLeave={handleGlobalMouseUp}
    >
      
      {/* Grid Canvas Area */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-auto bg-slate-100/50 relative scrollbar-thin scrollbar-thumb-slate-300 min-h-0 ${toolMode === 'move' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        style={{ touchAction: toolMode === 'move' ? 'none' : 'auto' }}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
      >
        <div className="min-w-full min-h-full p-4 sm:p-8 flex items-start sm:items-center justify-center">
          <div 
            className="relative bg-white shadow-sm border border-slate-200 select-none m-auto"
            style={{
              width: gridContentWidth + HEADER_SIZE,
              height: gridContentHeight + HEADER_SIZE,
              flexShrink: 0 
            }}
          >
            {/* Headers */}
            {Array.from({ length: columns }).map((_, c) => (
               <button
                 key={`col-btn-${c}`}
                 onClick={() => onFillCol(c)}
                 className="absolute top-0 flex flex-col items-center justify-end pb-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border-b border-slate-100 z-20 group"
                 style={{ left: HEADER_SIZE + c * CELL_WIDTH, width: CELL_WIDTH, height: HEADER_SIZE }}
               >
                 <span className={`${FONT_SIZE_CLASS} font-semibold leading-none`}>{c + 1}</span>
                 <ChevronDown size={isMobile ? 8 : 10} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
               </button>
            ))}
            {Array.from({ length: rows }).map((_, r) => (
               <button
                 key={`row-btn-${r}`}
                 onClick={() => onFillRow(r)}
                 className="absolute left-0 flex flex-row items-center justify-end pr-1 gap-0.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border-r border-slate-100 z-20 group"
                 style={{ top: HEADER_SIZE + r * CELL_HEIGHT, height: CELL_HEIGHT, width: HEADER_SIZE }}
               >
                 <span className={`${FONT_SIZE_CLASS} font-semibold`}>{r + 1}</span>
                 <ChevronRight size={isMobile ? 8 : 10} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
               </button>
            ))}

            {/* Grid */}
            <div 
                className="absolute" 
                style={{ 
                    top: HEADER_SIZE, 
                    left: HEADER_SIZE,
                    width: gridContentWidth,
                    height: gridContentHeight
                }}
            >
                {/* Overlay Image */}
                {overlay && (
                    <div 
                        className="absolute pointer-events-none"
                        style={{
                            top: overlay.y,
                            left: overlay.x,
                            zIndex: overlay.layer === 'front' ? 15 : 1
                        }}
                    >
                        <img 
                            src={overlay.dataUrl} 
                            alt="overlay" 
                            className="max-w-none max-h-none"
                            style={{
                                opacity: overlay.opacity,
                                transform: `scale(${overlay.scale * zoomLevel})`,
                                transformOrigin: 'top left',
                                userSelect: 'none'
                            }}
                        />
                    </div>
                )}

                {/* Beads Layer */}
                <div className="absolute inset-0 z-10">
                    {Array.from({ length: rows }).map((_, r) => (
                    <div key={`row-${r}`} className="absolute w-full" style={{ top: r * CELL_HEIGHT, height: CELL_HEIGHT }}>
                        {Array.from({ length: columns }).map((_, c) => {
                        const beadId = grid[`${r}-${c}`];
                        const bead = beadTypes.find(b => b.id === beadId);
                        const isGhost = ghostPixels.has(`${r}-${c}`);
                        const isPolygonVertex = toolMode === 'polygon' && polygonPoints.some(p => p.r === r && p.c === c);
                        const ghostBead = beadTypes.find(b => b.id === selectedBeadId);

                        let left = c * CELL_WIDTH;
                        if (mode === 'peyote' && r % 2 !== 0) { left += CELL_WIDTH / 2; }

                        return (
                            <div
                            key={`${r}-${c}`}
                            className={`absolute border border-slate-50/50 box-border ${toolMode !== 'move' && toolMode !== 'select' && toolMode !== 'paste' ? 'hover:border-indigo-300' : ''}`}
                            style={{
                                left: left, top: 0, width: CELL_WIDTH, height: CELL_HEIGHT,
                                zIndex: isGhost || isPolygonVertex ? 30 : 10
                            }}
                            onMouseDown={(e) => handleCellMouseDown(e, r, c)}
                            onMouseEnter={() => handleCellMouseEnter(r, c)}
                            >
                            {bead && !isGhost && (
                                <BeadRenderer color={bead.hex} material={bead.material} width={CELL_WIDTH-2} height={CELL_HEIGHT-2} isDelica={true} className="pointer-events-none" />
                            )}
                            {isGhost && ghostBead && (
                                <div className={`transform scale-105 transition-transform ${isPolygonVertex ? 'opacity-90 ring-1 ring-black' : 'opacity-60'}`}>
                                    <BeadRenderer color={ghostBead.hex} material={ghostBead.material} width={CELL_WIDTH-2} height={CELL_HEIGHT-2} isDelica={true} className="pointer-events-none" />
                                </div>
                            )}
                            </div>
                        );
                        })}
                    </div>
                    ))}
                </div>

                {/* Paste Ghost Overlay - Centered Logic */}
                {toolMode === 'paste' && clipboard && currentPos && (
                    <>
                        {Object.entries(clipboard.grid).map(([key, beadId]) => {
                             const [dr, dc] = key.split('-').map(Number);
                             const b = beadTypes.find(bead => bead.id === beadId);
                             if (!b) return null;

                             // Center logic matching App.tsx onPaste
                             const centerR = Math.floor(clipboard.height / 2);
                             const centerC = Math.floor(clipboard.width / 2);
                             
                             const targetR = currentPos.r - centerR + dr;
                             const targetC = currentPos.c - centerC + dc;

                             let left = targetC * CELL_WIDTH;
                             let top = targetR * CELL_HEIGHT;
                             
                             if (mode === 'peyote' && Math.abs(targetR) % 2 === 1) {
                                 left += CELL_WIDTH / 2;
                             }

                             return (
                                 <div 
                                    key={`ghost-${key}`} 
                                    className="absolute pointer-events-none opacity-50 z-40" 
                                    style={{ top, left, width: CELL_WIDTH, height: CELL_HEIGHT }}
                                 >
                                     <BeadRenderer color={b.hex} material={b.material} width={CELL_WIDTH-2} height={CELL_HEIGHT-2} isDelica={true} />
                                 </div>
                             )
                        })}
                    </>
                )}

                {/* Selection Overlay */}
                {selection && (
                    <div 
                        className="absolute border-2 border-indigo-500 bg-indigo-500/10 pointer-events-none z-50 border-dashed"
                        style={{
                            top: Math.min(selection.r1, selection.r2) * CELL_HEIGHT,
                            left: Math.min(selection.c1, selection.c2) * CELL_WIDTH,
                            height: (Math.abs(selection.r2 - selection.r1) + 1) * CELL_HEIGHT,
                            width: (Math.abs(selection.c2 - selection.c1) + 1) * CELL_WIDTH + (mode === 'peyote' ? CELL_WIDTH/2 : 0)
                        }}
                    />
                )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternEditor;
