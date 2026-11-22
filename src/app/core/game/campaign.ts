import { Pokemon } from '../pokemon';
import { Card, cardOf, total } from './cards';

export interface Gym {
  /** Identifiant de type PokéAPI. */
  type: number;
  leader: string;
  badge: string;
}

/** Les trois Pokémon de départ de chaque région (génération 1 à 9). */
export const STARTERS: readonly (readonly number[])[] = [
  [1, 4, 7], [152, 155, 158], [252, 255, 258], [387, 390, 393], [495, 498, 501],
  [650, 653, 656], [722, 725, 728], [810, 813, 816], [906, 909, 912],
];

const g = (type: number, leader: string, badge: string): Gym => ({ type, leader, badge });

/**
 * Huit arènes mono-type par région. Les champions et les badges sont inventés pour ce site :
 * on garde l'esprit des jeux sans recopier leurs personnages.
 */
export const GYMS: readonly (readonly Gym[])[] = [
  [g(6, 'Bérénice', 'Galet'), g(11, 'Malo', 'Écume'), g(13, 'Zélie', 'Éclair'), g(12, 'Anselme', 'Pétale'), g(4, 'Ysolde', 'Vapeur'), g(14, 'Octave', 'Songe'), g(10, 'Capucine', 'Braise'), g(5, 'Gaspard', 'Sillon')],
  [g(3, 'Noé', 'Duvet'), g(7, 'Lison', 'Antenne'), g(1, 'Odile', 'Simple'), g(8, 'Côme', 'Voile'), g(2, 'Maëlle', 'Poigne'), g(9, 'Firmin', 'Rivet'), g(15, 'Solveig', 'Givre'), g(16, 'Ambroise', 'Écaille')],
  [g(6, 'Maxence', 'Roc'), g(2, 'Titouan', 'Élan'), g(13, 'Hippolyte', 'Bobine'), g(10, 'Garance', 'Tison'), g(1, 'Léonie', 'Équilibre'), g(3, 'Aubin', 'Bourrasque'), g(14, 'Clélie', 'Pensée'), g(11, 'Marius', 'Averse')],
  [g(6, 'Basile', 'Anthracite'), g(12, 'Flore', 'Sous-bois'), g(2, 'Ludivine', 'Dalle'), g(11, 'Gaël', 'Tourbe'), g(8, 'Séraphine', 'Relique'), g(9, 'Eudes', 'Enclume'), g(15, 'Edwige', 'Flocon'), g(13, 'Léandre', 'Lanterne')],
  [g(12, 'Azélie', 'Trio'), g(1, 'Honoré', 'Base'), g(7, 'Perrine', 'Cocon'), g(13, 'Jules', 'Ampère'), g(5, 'Armand', 'Séisme'), g(3, 'Céleste', 'Planeur'), g(15, 'Sidonie', 'Congère'), g(16, 'Tancrède', 'Mythe')],
  [g(7, 'Apolline', 'Carapace'), g(6, 'Lazare', 'Falaise'), g(2, 'Rosalie', 'Duel'), g(12, 'Émile', 'Feuillage'), g(13, 'Cyprien', 'Fusible'), g(18, 'Églantine', 'Ruban'), g(14, 'Théodora', 'Vision'), g(15, 'Urbain', 'Banquise')],
  [g(1, 'Kalani', 'Aurore'), g(11, 'Moana', 'Lagon'), g(10, 'Keola', 'Cratère'), g(12, 'Leilani', 'Jungle'), g(13, 'Nalu', 'Orage'), g(8, 'Iolana', 'Ombre'), g(5, 'Makoa', 'Canyon'), g(18, 'Alana', 'Corolle')],
  [g(12, 'Wilfred', 'Herbe'), g(11, 'Morwen', 'Vague'), g(10, 'Aldric', 'Flamme'), g(2, 'Brianne', 'Uppercut'), g(18, 'Opaline', 'Féérie'), g(6, 'Hamish', 'Pierre'), g(17, 'Corbin', 'Nuit'), g(16, 'Edwin', 'Croc')],
  [g(7, 'Carmela', 'Abeille'), g(12, 'Rodrigo', 'Olive'), g(13, 'Inès', 'Courant'), g(11, 'Paloma', 'Port'), g(1, 'Lorenzo', 'Comptoir'), g(8, 'Ramiro', 'Écho'), g(14, 'Alma', 'Mirage'), g(15, 'Nieves', 'Sommet')],
];

/** Numéro de l'étape « Ligue », après les huit arènes. */
export const LEAGUE = 9;

/** Seuil de puissance visé pour l'équipe adverse : il monte d'arène en arène. */
const targetTotal = (gym: number) => (gym === LEAGUE ? 560 : 290 + gym * 30);

/** Les `count` Pokémon dont la puissance est la plus proche de la cible, parmi `pool`. */
function closest(pool: Pokemon[], target: number, count: number): Pokemon[] {
  return [...pool].sort((a, b) => Math.abs(total(a) - target) - Math.abs(total(b) - target) || a.id - b.id).slice(0, count);
}

/**
 * Équipe d'une arène : trois Pokémon du type de l'arène, pris de préférence dans la région,
 * dont la puissance est la plus proche de la cible. La Ligue aligne les plus forts de la région.
 */
export function gymTeam(all: Pokemon[], region: number, gym: number): Card[] {
  const local = all.filter((p) => p.gen === region && p.rank === 0);
  if (gym === LEAGUE) return closest(local, targetTotal(gym), 3).map((p) => cardOf(p, 8));
  const type = GYMS[region - 1][gym - 1].type;
  let pool = local.filter((p) => p.types.includes(type));
  if (pool.length < 3) pool = all.filter((p) => p.rank === 0 && p.types.includes(type));
  return closest(pool, targetTotal(gym), 3).map((p) => cardOf(p, gym));
}

/** Adversaire d'un duel libre : trois cartes de puissance voisine de celle du joueur. */
export function rivalTeam(all: Pokemon[], playerAverage: number, random: () => number = Math.random): Card[] {
  const pool = all.filter((p) => p.rank === 0 && Math.abs(total(p) - playerAverage) <= 70);
  const picked: Pokemon[] = [];
  while (picked.length < 3 && pool.length) picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return picked.map((p) => cardOf(p));
}

/** Les deux compagnons offerts avec le starter : des Pokémon simples de la même région. */
export function companions(all: Pokemon[], region: number): Pokemon[] {
  const starters = STARTERS[region - 1];
  return all.filter((p) => p.gen === region && p.from === 0 && p.rank === 0 && total(p) <= 320 && total(p) >= 220 && !starters.includes(p.id)).slice(0, 2);
}
