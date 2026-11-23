/** Une entrée de public/data/pokedex.json (voir scripts/build-data.mjs). */
export interface Pokemon {
  id: number;
  name: string;
  types: number[];
  gen: number;
  /** PV, Attaque, Défense, Atq. Spé., Déf. Spé., Vitesse. */
  stats: number[];
  height: number;
  weight: number;
  shape: number;
  /** 0 = normal, 1 = légendaire, 2 = fabuleux. */
  rank: number;
  /** Espèce dont il évolue (0 = aucune). */
  from: number;
  chain: number;
  /** Niveau d'évolution dans les jeux (0 = autre condition). */
  level: number;
  /** Ses quatre capacités de combat (identifiants PokéAPI, voir core/game/capacites.ts). */
  moves: number[];
}

export interface PokemonDetails {
  genus: string;
  text: string;
  abilities: { name: string; hidden: boolean }[];
  capture: number;
}

const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export const artwork = (id: number, shiny = false) => `${SPRITES}/other/official-artwork/${shiny ? 'shiny/' : ''}${id}.png`;
export const animated = (id: number, back = false) => `${SPRITES}/other/showdown/${back ? 'back/' : ''}${id}.gif`;
export const cry = (id: number) => `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
export const dexNumber = (id: number) => '#' + String(id).padStart(4, '0');

/** Minuscules sans accents, pour comparer « evoli » et « Évoli ». */
export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
