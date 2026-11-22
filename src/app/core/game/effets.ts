// Généré par scripts/extraire-effets.py : ne pas modifier à la main.
export interface Effet { frames: number; w: number; h: number }

export const EFFETS: Record<string, Effet> = {
  normal: { frames: 1, w: 57, h: 51 },
  combat: { frames: 1, w: 16, h: 15 },
  vol: { frames: 2, w: 24, h: 48 },
  poison: { frames: 1, w: 26, h: 25 },
  sol: { frames: 3, w: 22, h: 12 },
  roche: { frames: 5, w: 15, h: 16 },
  insecte: { frames: 1, w: 26, h: 28 },
  spectre: { frames: 4, w: 24, h: 24 },
  acier: { frames: 1, w: 16, h: 16 },
  feu: { frames: 3, w: 20, h: 23 },
  eau: { frames: 3, w: 20, h: 18 },
  plante: { frames: 6, w: 30, h: 42 },
  electrik: { frames: 1, w: 23, h: 78 },
  psy: { frames: 8, w: 8, h: 13 },
  glace: { frames: 1, w: 17, h: 18 },
  dragon: { frames: 1, w: 17, h: 26 },
  tenebres: { frames: 4, w: 17, h: 12 },
  fee: { frames: 1, w: 13, h: 13 },
  impact: { frames: 4, w: 22, h: 22 },
  garde: { frames: 7, w: 37, h: 65 },
};
