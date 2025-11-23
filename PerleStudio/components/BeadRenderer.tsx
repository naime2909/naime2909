import React from 'react';
import { MaterialType } from '../types';

interface BeadRendererProps {
  color: string;
  material: MaterialType;
  width: number;
  height: number;
  className?: string;
  onClick?: () => void;
  isDelica?: boolean; // Forme cylindrique pour Miyuki Delica
}

const BeadRenderer: React.FC<BeadRendererProps> = ({ color, material, width, height, className, onClick, isDelica = false }) => {
  let overlay = null;

  // Effets de matière simples
  switch (material) {
    case MaterialType.CRYSTAL:
      overlay = <rect x="20%" y="20%" width="20%" height="20%" fill="white" fillOpacity="0.4" />;
      break;
    case MaterialType.MATTE:
      overlay = <rect x="0" y="0" width="100%" height="100%" fill="rgba(255,255,255,0.05)" />;
      break;
    case MaterialType.METAL:
    case MaterialType.GLOSSY:
      overlay = (
        <linearGradient id={`grad-${color.replace('#', '')}-${material}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="50%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.2" />
        </linearGradient>
      );
      break;
    default:
      break;
  }

  const borderRadius = isDelica ? 1 : Math.min(width, height) / 2;

  return (
    <div 
      className={`cursor-pointer transition-transform ${className}`} 
      style={{ width: width, height: height }}
      onClick={onClick}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]" preserveAspectRatio="none">
        <rect 
          x="2" y="2" 
          width="96" height="96" 
          rx={isDelica ? 10 : 50} 
          ry={isDelica ? 10 : 50} 
          fill={color} 
          stroke="rgba(0,0,0,0.1)" 
          strokeWidth="2" 
        />
        
        {(material === MaterialType.GLOSSY || material === MaterialType.METAL) && (
           <rect 
             x="2" y="2" 
             width="96" height="96" 
             rx={isDelica ? 10 : 50} 
             fill={`url(#grad-${color.replace('#', '')}-${material})`} 
           />
        )}
        
        {/* Texture overlay logic simplified for SVG */}
        {material === MaterialType.WOOD && (
            <path d="M0,20 Q50,50 100,20 M0,50 Q50,80 100,50" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="5" />
        )}
      </svg>
    </div>
  );
};

export default BeadRenderer;