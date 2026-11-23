import { Pokemon } from '../pokemon';
import { CAPACITES, Capacite } from './capacites';

/** Une capacité de combat, avec son identifiant PokéAPI. */
export interface Move extends Capacite {
  id: number;
}

export interface Card {
  id: number;
  name: string;
  types: number[];
  /** Niveau de combat, calculé à partir du niveau de la carte. */
  level: number;
  hp: number;
  atk: number;
  def: number;
  /** Attaque spéciale et Défense spéciale. */
  spa: number;
  spdef: number;
  /** Vitesse. */
  spd: number;
  moves: Move[];
}

export const total = (p: Pokemon) => p.stats.reduce((a, b) => a + b, 0);

/** Repli si un Pokémon n'avait aucune capacité offensive dans les données. */
const CHARGE: Move = { id: 33, nom: 'Charge', type: 1, puissance: 40, precision: 100, pp: 35, classe: 'physique', priorite: 0 };

export const moveOf = (id: number): Move => (CAPACITES[id] ? { id, ...CAPACITES[id] } : CHARGE);

/** Niveau de combat d'une carte : 42 au niveau 1, puis +2 par niveau de carte. */
export const battleLevel = (cardLevel: number) => 40 + cardLevel * 2;

/**
 * Transforme un Pokémon en carte de duel avec les formules des jeux (individuelles au maximum,
 * sans entraînement ni nature) : rien n'est saisi à la main, les 1 025 cartes existent d'office.
 */
export function cardOf(p: Pokemon, level = 1): Card {
  const L = battleLevel(level);
  const stat = (base: number) => Math.floor(((2 * base + 31) * L) / 100) + 5;
  const [hp, atk, def, spa, spdef, spd] = p.stats;
  return {
    id: p.id,
    name: p.name,
    types: p.types,
    level: L,
    hp: Math.floor(((2 * hp + 31) * L) / 100) + L + 10,
    atk: stat(atk),
    def: stat(def),
    spa: stat(spa),
    spdef: stat(spdef),
    spd: stat(spd),
    moves: (p.moves?.length ? p.moves : [33]).map(moveOf),
  };
}

/** Niveau de carte à atteindre pour évoluer vers `target` (repris du niveau des jeux, ramené à l'échelle des cartes). */
export function evolutionLevel(target: Pokemon): number {
  return target.level ? Math.min(8, Math.max(2, Math.round(target.level / 8))) : 4;
}
