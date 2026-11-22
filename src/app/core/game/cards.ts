import { Pokemon } from '../pokemon';

export interface Technique {
  name: string;
  /** Identifiant de type PokéAPI. */
  type: number;
  power: number;
  /** Énergie à dépenser pour la lancer. */
  cost: number;
}

export interface Card {
  id: number;
  name: string;
  types: number[];
  hp: number;
  atk: number;
  spd: number;
  tech: Technique;
}

/** Deux techniques par type : une de base pour les jeunes Pokémon, une forte pour les autres. */
const TECHS: Record<number, [name: string, power: number][]> = {
  1: [['Charge', 40], ['Plaquage', 85]],
  2: [['Poing Karaté', 50], ['Aurasphère', 80]],
  3: [['Tornade', 40], ['Lame d’Air', 75]],
  4: [['Acide', 40], ['Bombe Beurk', 90]],
  5: [['Coud’Boue', 55], ['Séisme', 100]],
  6: [['Jet-Pierres', 50], ['Lame de Roc', 100]],
  7: [['Survinsecte', 50], ['Bourdon', 90]],
  8: [['Léchouille', 30], ['Ball’Ombre', 80]],
  9: [['Griffe Acier', 50], ['Luminocanon', 80]],
  10: [['Flammèche', 40], ['Lance-Flammes', 90]],
  11: [['Pistolet à O', 40], ['Surf', 90]],
  12: [['Fouet Lianes', 45], ['Lame Feuille', 90]],
  13: [['Éclair', 40], ['Tonnerre', 90]],
  14: [['Choc Mental', 50], ['Psyko', 90]],
  15: [['Poudreuse', 40], ['Laser Glace', 90]],
  16: [['Dracosouffle', 60], ['Dracochoc', 85]],
  17: [['Morsure', 60], ['Vibrobscur', 80]],
  18: [['Vent Féérique', 40], ['Éclat Magique', 80]],
};

export const total = (p: Pokemon) => p.stats.reduce((a, b) => a + b, 0);

/**
 * Transforme un Pokémon en carte de duel. Tout vient de ses statistiques de base :
 * rien n'est saisi à la main, donc les 1 025 cartes existent dès que les données sont là.
 */
export function cardOf(p: Pokemon, level = 1): Card {
  const [basic, strong] = TECHS[p.types[0]];
  const [name, power] = total(p) >= 430 ? strong : basic;
  const bonus = level - 1;
  return {
    id: p.id,
    name: p.name,
    types: p.types,
    hp: p.stats[0] + 60 + bonus * 4,
    atk: Math.max(p.stats[1], p.stats[3]) + bonus * 2,
    spd: p.stats[5],
    tech: { name, type: p.types[0], power, cost: power <= 60 ? 1 : power >= 100 ? 3 : 2 },
  };
}

/** Niveau de carte à atteindre pour évoluer vers `target` (repris du niveau des jeux, ramené à l'échelle des cartes). */
export function evolutionLevel(target: Pokemon): number {
  return target.level ? Math.min(8, Math.max(2, Math.round(target.level / 8))) : 4;
}
