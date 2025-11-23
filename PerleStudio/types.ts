
export enum MaterialType {
  MATTE = 'Mat',
  GLOSSY = 'Brillant',
  CRYSTAL = 'Cristal',
  WOOD = 'Bois',
  METAL = 'Métal'
}

export interface BeadType {
  id: string;
  name: string;
  color: string;
  material: MaterialType;
  hex: string;
}

export type PatternMode = 'loom' | 'peyote';

// Clé de la grille : "row-col", Valeur : beadId
export type PatternGrid = Record<string, string>;

export interface ProjectState {
  mode: PatternMode;
  columns: number; // Largeur du bracelet en nombre de perles
  rows: number;    // Longueur du bracelet en nombre de perles
  grid: PatternGrid;
}

export interface OverlayImage {
  id: string;
  dataUrl: string;
  opacity: number; // 0 to 1
  scale: number; // multiplier
  x: number; // px offset relative to grid origin
  y: number; // px offset relative to grid origin
  width: number; // original width in px
  height: number; // original height in px
  layer: 'front' | 'back';
}

export interface BraceletSettings {
  beadSizeMm: number; // Hauteur/Largeur approximative
  wristSizeCm: number;
}

export interface AIResponseSchema {
  paletteName: string;
  description: string;
  colors: {
    name: string;
    hex: string;
    suggestion: string;
  }[];
}

export type ToolMode = 'pencil' | 'eraser' | 'rectangle' | 'circle' | 'move' | 'polygon' | 'select' | 'paste';

export interface SelectionArea {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

export interface ClipboardData {
  width: number;
  height: number;
  grid: PatternGrid; // Relative coordinates (0-0 based)
}
