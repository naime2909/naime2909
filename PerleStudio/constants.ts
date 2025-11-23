
import { BeadType, MaterialType } from './types';

// Tailles standards pour le tissage
export const BEAD_SIZES = [
  { label: 'Miyuki Delica 11/0 (1.6mm)', value: 1.6 },
  { label: 'Rocaille 11/0 (2.0mm)', value: 2.0 },
  { label: 'Rocaille 8/0 (3.0mm)', value: 3.0 },
  { label: 'Perle Ronde 4mm', value: 4.0 },
  { label: 'Perle Ronde 6mm', value: 6.0 },
];

export const DEFAULT_BEADS: BeadType[] = [
  { id: 'b1', name: 'Rouge Vif', color: 'red', material: MaterialType.MATTE, hex: '#ef4444' },
  { id: 'b2', name: 'Bleu Roi', color: 'blue', material: MaterialType.GLOSSY, hex: '#1e3a8a' },
  { id: 'b3', name: 'Émeraude', color: 'green', material: MaterialType.CRYSTAL, hex: '#047857' },
  { id: 'b4', name: 'Or Galvanisé', color: 'gold', material: MaterialType.METAL, hex: '#fbbf24' },
  { id: 'b5', name: 'Noir Opaque', color: 'black', material: MaterialType.MATTE, hex: '#171717' },
  { id: 'b6', name: 'Blanc Nacré', color: 'white', material: MaterialType.GLOSSY, hex: '#f8fafc' },
];

export const WRIST_SIZES = [
  { label: 'Enfant (13cm)', value: 13 },
  { label: 'Ado / XS (15cm)', value: 15 },
  { label: 'Femme S (16cm)', value: 16 },
  { label: 'Femme M (17cm)', value: 17 },
  { label: 'Femme L / Homme S (18cm)', value: 18 },
  { label: 'Homme M (19cm)', value: 19 },
  { label: 'Homme L (21cm)', value: 21 },
];

// Constantes pour l'interface de l'éditeur (en pixels)
export const EDITOR_CONSTANTS = {
  MOBILE: { CELL_WIDTH: 20, CELL_HEIGHT: 17, HEADER_SIZE: 24 },
  DESKTOP: { CELL_WIDTH: 26, CELL_HEIGHT: 22, HEADER_SIZE: 32 }
};

// Catalogue étendu de couleurs pour la sélection manuelle
export const PRESET_COLORS = [
  // Basics
  { name: 'Noir Mat', hex: '#1a1a1a', material: MaterialType.MATTE },
  { name: 'Noir Brillant', hex: '#000000', material: MaterialType.GLOSSY },
  { name: 'Blanc Albâtre', hex: '#fdfbf7', material: MaterialType.GLOSSY },
  { name: 'Blanc Mat', hex: '#f5f5f5', material: MaterialType.MATTE },
  
  // Metals
  { name: 'Or 24k', hex: '#d4af37', material: MaterialType.METAL },
  { name: 'Argent Sterling', hex: '#c0c0c0', material: MaterialType.METAL },
  { name: 'Bronze Antique', hex: '#804a00', material: MaterialType.METAL },
  { name: 'Cuivre', hex: '#b87333', material: MaterialType.METAL },
  { name: 'Gunmetal', hex: '#4a4a4a', material: MaterialType.METAL },
  { name: 'Or Rose', hex: '#b76e79', material: MaterialType.METAL },

  // Reds / Pinks
  { name: 'Rouge Rubis', hex: '#9b111e', material: MaterialType.CRYSTAL },
  { name: 'Rouge Cerise', hex: '#D2042D', material: MaterialType.GLOSSY },
  { name: 'Rose Bonbon', hex: '#ffc0cb', material: MaterialType.MATTE },
  { name: 'Fuchsia', hex: '#ff00ff', material: MaterialType.GLOSSY },
  { name: 'Saumon', hex: '#fa8072', material: MaterialType.MATTE },
  { name: 'Corail', hex: '#ff7f50', material: MaterialType.GLOSSY },

  // Blues
  { name: 'Bleu Ciel', hex: '#87ceeb', material: MaterialType.MATTE },
  { name: 'Turquoise', hex: '#40e0d0', material: MaterialType.GLOSSY },
  { name: 'Bleu Marine', hex: '#000080', material: MaterialType.MATTE },
  { name: 'Saphir', hex: '#0f52ba', material: MaterialType.CRYSTAL },
  { name: 'Bleu Canard', hex: '#008080', material: MaterialType.GLOSSY },
  { name: 'Indigo', hex: '#4b0082', material: MaterialType.MATTE },

  // Greens
  { name: 'Vert Menthe', hex: '#98ff98', material: MaterialType.MATTE },
  { name: 'Vert Olive', hex: '#808000', material: MaterialType.MATTE },
  { name: 'Émeraude', hex: '#50c878', material: MaterialType.CRYSTAL },
  { name: 'Vert Citron', hex: '#32cd32', material: MaterialType.GLOSSY },
  { name: 'Vert Forêt', hex: '#228b22', material: MaterialType.MATTE },

  // Yellows / Oranges
  { name: 'Jaune Citron', hex: '#fff700', material: MaterialType.GLOSSY },
  { name: 'Ambre', hex: '#ffbf00', material: MaterialType.CRYSTAL },
  { name: 'Orange Vif', hex: '#ffa500', material: MaterialType.GLOSSY },
  { name: 'Pêche', hex: '#ffe5b4', material: MaterialType.MATTE },
  { name: 'Moutarde', hex: '#ffdb58', material: MaterialType.MATTE },

  // Purples
  { name: 'Lavande', hex: '#e6e6fa', material: MaterialType.MATTE },
  { name: 'Violet', hex: '#8a2be2', material: MaterialType.GLOSSY },
  { name: 'Prune', hex: '#dda0dd', material: MaterialType.MATTE },
  { name: 'Lilas', hex: '#c8a2c8', material: MaterialType.GLOSSY },
];
