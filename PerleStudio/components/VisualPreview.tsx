import React from 'react';
import { BeadType, ProjectState } from '../types';
import { Eye } from 'lucide-react';

interface VisualPreviewProps {
  project: ProjectState;
  beadTypes: BeadType[];
  orientation?: 'vertical' | 'horizontal';
}

const VisualPreview: React.FC<VisualPreviewProps> = ({ project, beadTypes, orientation = 'vertical' }) => {
  const { rows, columns: cols, mode, grid } = project;
  const isHorizontal = orientation === 'horizontal';
  
  // Dimensions virtuelles pour le dessin vectoriel
  // Bead physique ~ 1.6mm (W) x 1.3mm (H)
  // Vertical View (Standard): W=10, H=8.5
  // Horizontal View (Rotated): W=8.5, H=10 (Le rectangle de la perle pivote)
  const BEAD_W_BASE = 10;
  const BEAD_H_BASE = 8.5;

  // Taille du rectangle SVG pour une perle
  const beadRectW = isHorizontal ? BEAD_H_BASE : BEAD_W_BASE;
  const beadRectH = isHorizontal ? BEAD_W_BASE : BEAD_H_BASE;
  
  // Calcul de la taille totale du dessin (ViewBox)
  // Si Horizontal: Largeur totale = Nombre de rangs * Hauteur perle
  //                Hauteur totale = Nombre de colonnes * Largeur perle (+ décalage peyote)
  const totalWidth = isHorizontal 
    ? rows * BEAD_H_BASE 
    : cols * BEAD_W_BASE + (mode === 'peyote' ? BEAD_W_BASE / 2 : 0);
    
  const totalHeight = isHorizontal
    ? cols * BEAD_W_BASE + (mode === 'peyote' ? BEAD_W_BASE / 2 : 0)
    : rows * BEAD_H_BASE;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 flex ${isHorizontal ? 'flex-row h-full w-full' : 'flex-col h-[400px]'} items-center p-3 overflow-hidden`}>
      <h3 className={`font-semibold text-slate-700 flex items-center gap-2 shrink-0 ${isHorizontal ? 'mr-4 text-sm w-24' : 'mb-2 w-full'}`}>
        <Eye size={20} className="text-indigo-600" />
        {isHorizontal ? "Aperçu" : "Aperçu Global"}
      </h3>
      
      <div className="flex-1 w-full h-full bg-slate-100 rounded-lg p-2 shadow-inner relative flex items-center justify-center overflow-hidden">
        {Object.keys(grid).length === 0 ? (
          <div className="text-center text-slate-400 text-xs">
            <p>Dessinez pour voir le résultat</p>
          </div>
        ) : (
            <svg 
                viewBox={`0 0 ${totalWidth} ${totalHeight}`} 
                className="max-w-full max-h-full drop-shadow-xl transition-all duration-500"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <filter id="bead-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" />
                        <feOffset dx="0.2" dy="0.2" result="offsetblur" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.3" />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Fond */}
                <rect x="0" y="0" width={totalWidth} height={totalHeight} fill="none" />

                {Array.from({ length: rows }).map((_, r) => (
                    Array.from({ length: cols }).map((_, c) => {
                        const beadId = grid[`${r}-${c}`];
                        const bead = beadTypes.find(b => b.id === beadId);
                        
                        let x, y;

                        if (isHorizontal) {
                            // Axe X = Rangs (Longueur), Axe Y = Colonnes (Largeur)
                            x = r * BEAD_H_BASE;
                            y = c * BEAD_W_BASE;
                            // Décalage Peyote sur l'axe Y (Colonnes) en fonction du rang (X)
                            if (mode === 'peyote' && r % 2 !== 0) {
                                y += BEAD_W_BASE / 2;
                            }
                        } else {
                            // Standard Vertical
                            x = c * BEAD_W_BASE;
                            if (mode === 'peyote' && r % 2 !== 0) {
                                x += BEAD_W_BASE / 2;
                            }
                            y = r * BEAD_H_BASE;
                        }

                        return (
                            <rect
                                key={`v-${r}-${c}`}
                                x={x}
                                y={y}
                                width={beadRectW}
                                height={beadRectH}
                                rx={isHorizontal ? 0.5 : 1} 
                                fill={bead ? bead.hex : '#e2e8f0'} 
                                fillOpacity={bead ? 1 : 0.3}
                                stroke={bead ? 'rgba(0,0,0,0.1)' : 'none'}
                                strokeWidth={0.5}
                            />
                        );
                    })
                ))}
            </svg>
        )}
      </div>
    </div>
  );
};

export default VisualPreview;