// Généré par scripts/extraire-dresseurs.py. Ne pas modifier à la main.
// Sprites de Pokémon Or HeartGold et Argent SoulSilver, planche rassemblée par Dann-The-Yoshi.
export interface Dresseur {
  nom: string;
  w: number;
  h: number;
}

export const DRESSEURS: Record<string, Dresseur> = {
  'jeune-pousse': { nom: "Jeune pousse", w: 35, h: 58 },
  'fillette': { nom: "Fillette", w: 46, h: 67 },
  'campeur': { nom: "Campeur", w: 30, h: 73 },
  'cow-girl': { nom: "Cow-girl", w: 41, h: 66 },
  'topdresseur': { nom: "Topdresseur", w: 39, h: 76 },
  'topdresseuse': { nom: "Topdresseuse", w: 44, h: 75 },
  'aventurier': { nom: "Aventurier", w: 32, h: 75 },
  'aventuriere': { nom: "Aventurière", w: 39, h: 70 },
  'karateka': { nom: "Karatéka", w: 50, h: 77 },
  'acrobate': { nom: "Acrobate", w: 47, h: 69 },
  'detective': { nom: "Détective", w: 48, h: 75 },
  'archeologue': { nom: "Archéologue", w: 52, h: 53 },
  'montagnard': { nom: "Montagnard", w: 51, h: 76 },
  'chasseur-insectes': { nom: "Chasseur d’insectes", w: 54, h: 71 },
  'moine': { nom: "Moine", w: 55, h: 79 },
  'ouvrier': { nom: "Ouvrier", w: 51, h: 53 },
  'cracheur-feu': { nom: "Cracheur de feu", w: 80, h: 72 },
  'nageuse': { nom: "Nageuse", w: 32, h: 76 },
  'jardiniere': { nom: "Jardinière", w: 50, h: 52 },
  'rockeur': { nom: "Rockeur", w: 47, h: 74 },
  'medium': { nom: "Médium", w: 49, h: 71 },
  'skieuse': { nom: "Skieuse", w: 75, h: 71 },
  'motard': { nom: "Motard", w: 75, h: 79 },
  'dame': { nom: "Dame", w: 41, h: 69 },
  'marin': { nom: "Marin", w: 39, h: 73 },
};

export const dresseurImg = (cle: string) => `dresseurs/${cle}.png`;
