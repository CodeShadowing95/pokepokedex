import { Rand } from './duel';

/**
 * La capture, avec la formule des jeux de la quatrième génération (Diamant, Perle, Or HeartGold…).
 * Chaque espèce a son taux de capture (3 pour un légendaire, 255 pour un Chenipan) ; moins il reste
 * de PV, plus la balle a de chances de tenir. Quatre tests de secousse : tous réussis, le Pokémon est pris.
 */

/** Sous ce seuil de PV (la jauge passe au rouge), un Pokémon sauvage peut être capturé. */
export const SEUIL_CAPTURE = 0.3;
/**
 * Bonus de la balle. Les jeux ont le sommeil et la paralysie pour aider la capture ; ce duel n'a pas
 * d'altérations d'état, alors la Pokéball compense un peu (×1,5, comme une Super Ball).
 */
export const BONUS_BALLE = 1.5;

export const capturable = (hp: number, max: number) => hp > 0 && hp / max < SEUIL_CAPTURE;

/** La valeur « a » des jeux : 255 ou plus, la capture est assurée. */
export function valeurCapture(taux: number, hp: number, max: number, bonus = BONUS_BALLE): number {
  return Math.floor((((3 * max - 2 * hp) * taux * bonus) / (3 * max)));
}

/** Probabilité de réussir un test de secousse (sur 65 536 dans les jeux). */
export function chanceSecousse(a: number): number {
  if (a >= 255) return 1;
  if (a <= 0) return 0;
  return Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / a))) / 65536;
}

/** Probabilité totale de capture, pour l'afficher ou la tester. */
export function chanceCapture(taux: number, hp: number, max: number): number {
  return chanceSecousse(valeurCapture(taux, hp, max)) ** 4;
}

export interface Lancer {
  /** Secousses montrées avant le verdict, de 0 à 3. */
  secousses: number;
  capture: boolean;
}

export function lancer(taux: number, hp: number, max: number, rand: Rand = Math.random): Lancer {
  const p = chanceSecousse(valeurCapture(taux, hp, max));
  let reussis = 0;
  while (reussis < 4 && rand() < p) reussis++;
  return { secousses: Math.min(3, reussis), capture: reussis === 4 };
}
