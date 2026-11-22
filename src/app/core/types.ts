/** Les 18 types, indexés par leur identifiant PokéAPI (1 = Normal … 18 = Fée). */
export interface TypeInfo {
  id: number;
  key: string;
  label: string;
  /** Encre de type définie par la charte. */
  color: string;
  /** Couleur du texte posé sur cette encre (contraste AA vérifié). */
  text: string;
  /** Symbole du type (public/types/<key>.webp). */
  icon: string;
}

const INK = '#1E2340';
const t = (id: number, key: string, label: string, color: string, text = INK): TypeInfo => ({ id, key, label, color, text, icon: `types/${key}.webp` });

export const TYPES: readonly TypeInfo[] = [
  t(1, 'normal', 'Normal', '#B8B08D'),
  t(2, 'combat', 'Combat', '#C4412E', '#fff'),
  t(3, 'vol', 'Vol', '#93A8F2'),
  t(4, 'poison', 'Poison', '#A84FB4', '#fff'),
  t(5, 'sol', 'Sol', '#D9A953'),
  t(6, 'roche', 'Roche', '#B39C53'),
  t(7, 'insecte', 'Insecte', '#9CB52A'),
  t(8, 'spectre', 'Spectre', '#6A5A9C', '#fff'),
  t(9, 'acier', 'Acier', '#9AA9B8'),
  t(10, 'feu', 'Feu', '#F2762E'),
  t(11, 'eau', 'Eau', '#5AA0EC'),
  t(12, 'plante', 'Plante', '#4FAE4A'),
  t(13, 'electrik', 'Électrik', '#F7D02C'),
  t(14, 'psy', 'Psy', '#F25C8A'),
  t(15, 'glace', 'Glace', '#7FD3D0'),
  t(16, 'dragon', 'Dragon', '#5F4BE0', '#fff'),
  t(17, 'tenebres', 'Ténèbres', '#5A4A3F', '#fff'),
  t(18, 'fee', 'Fée', '#F0A3D0'),
];

export const typeOf = (id: number): TypeInfo => TYPES[id - 1];

/** Table des types : attaquant → défenseur → multiplicateur (absent = ×1). */
const CHART: Record<string, Record<string, number>> = {
  normal: { roche: 0.5, acier: 0.5, spectre: 0 },
  feu: { plante: 2, glace: 2, insecte: 2, acier: 2, feu: 0.5, eau: 0.5, roche: 0.5, dragon: 0.5 },
  eau: { feu: 2, sol: 2, roche: 2, eau: 0.5, plante: 0.5, dragon: 0.5 },
  plante: { eau: 2, sol: 2, roche: 2, feu: 0.5, plante: 0.5, poison: 0.5, vol: 0.5, insecte: 0.5, dragon: 0.5, acier: 0.5 },
  electrik: { eau: 2, vol: 2, electrik: 0.5, plante: 0.5, dragon: 0.5, sol: 0 },
  glace: { plante: 2, sol: 2, vol: 2, dragon: 2, feu: 0.5, eau: 0.5, glace: 0.5, acier: 0.5 },
  combat: { normal: 2, glace: 2, roche: 2, tenebres: 2, acier: 2, poison: 0.5, vol: 0.5, psy: 0.5, insecte: 0.5, fee: 0.5, spectre: 0 },
  poison: { plante: 2, fee: 2, poison: 0.5, sol: 0.5, roche: 0.5, spectre: 0.5, acier: 0 },
  sol: { feu: 2, electrik: 2, poison: 2, roche: 2, acier: 2, plante: 0.5, insecte: 0.5, vol: 0 },
  vol: { plante: 2, combat: 2, insecte: 2, electrik: 0.5, roche: 0.5, acier: 0.5 },
  psy: { combat: 2, poison: 2, psy: 0.5, acier: 0.5, tenebres: 0 },
  insecte: { plante: 2, psy: 2, tenebres: 2, feu: 0.5, combat: 0.5, poison: 0.5, vol: 0.5, spectre: 0.5, acier: 0.5, fee: 0.5 },
  roche: { feu: 2, glace: 2, vol: 2, insecte: 2, combat: 0.5, sol: 0.5, acier: 0.5 },
  spectre: { psy: 2, spectre: 2, tenebres: 0.5, normal: 0 },
  dragon: { dragon: 2, acier: 0.5, fee: 0 },
  tenebres: { psy: 2, spectre: 2, combat: 0.5, tenebres: 0.5, fee: 0.5 },
  acier: { glace: 2, roche: 2, fee: 2, feu: 0.5, eau: 0.5, electrik: 0.5, acier: 0.5 },
  fee: { combat: 2, dragon: 2, tenebres: 2, feu: 0.5, poison: 0.5, acier: 0.5 },
};

/** Multiplicateur d'une attaque de type `attack` contre un Pokémon ayant les types `defenders`. */
export function effectiveness(attack: number, defenders: readonly number[]): number {
  const row = CHART[typeOf(attack).key];
  return defenders.reduce((m, d) => m * (row[typeOf(d).key] ?? 1), 1);
}

export const REGIONS = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unys', 'Kalos', 'Alola', 'Galar', 'Paldea'] as const;
export const STAT_LABELS = ['PV', 'Attaque', 'Défense', 'Atq. Spé.', 'Déf. Spé.', 'Vitesse'] as const;
