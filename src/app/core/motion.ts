import { Pokemon } from './pokemon';

export type Gesture = 'plane' | 'flotte' | 'respire' | 'vif' | 'bondit' | 'ondule' | 'nage';

export interface Signature {
  gesture: Gesture;
  /** Durée d'un cycle en secondes. */
  period: number;
  /** Phrase affichée sur la fiche. */
  reason: string;
}

const VOL = 3, SPECTRE = 8, EAU = 11;
const SQUIGGLE = 2, FISH = 3, WINGS = 9, BUG_WINGS = 13;

/**
 * Déduit le mouvement d'un Pokémon de ses seules données : silhouette, types, poids, vitesse.
 * Aucune animation n'est dessinée à la main, donc les 1 025 fiches bougent sans travail par Pokémon.
 */
export function signatureOf(p: Pokemon): Signature {
  const speed = p.stats[5];
  const period = Math.round(Math.min(7, Math.max(1.4, 1.6 + Math.log10(p.weight + 1) * 1.6 + (130 - speed) / 40)) * 10) / 10;
  const make = (gesture: Gesture, reason: string): Signature => ({ gesture, period, reason });

  if (p.types.includes(SPECTRE)) return make('flotte', 'Type Spectre : il flotte et s’efface par moments.');
  if (p.shape === SQUIGGLE) return make('ondule', 'Silhouette sinueuse : il ondule.');
  if (p.types.includes(VOL) || p.shape === WINGS || p.shape === BUG_WINGS) return make('plane', 'Il vole : il plane, porté par de lents battements.');
  if (p.shape === FISH && p.types.includes(EAU)) return make('nage', 'Il nage : il se balance comme dans le courant.');
  if (p.weight >= 200 || speed <= 35) return make('respire', 'Lourd ou lent : il ne fait que respirer, ancré au sol.');
  if (speed >= 105) return make('vif', 'Très rapide : immobile, puis un déplacement sec.');
  if (p.weight <= 12) return make('bondit', 'Petit et léger : il sautille.');
  return make('respire', 'Posé : il respire calmement.');
}
