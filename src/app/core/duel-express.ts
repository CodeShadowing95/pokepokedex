import { TYPES, effectiveness } from './types';

/** Les réponses possibles du quiz, de la plus faible à la plus forte. */
export const FACTEURS = [0, 0.25, 0.5, 1, 2, 4] as const;

export const facteurFr = (n: number): string => String(n).replace('.', ',');

/** Le cri du tampon pour un multiplicateur donné. */
export function cri(n: number): string {
  if (n === 0) return 'Aucun effet !';
  if (n >= 4) return 'Ultra efficace !';
  if (n >= 2) return 'Super efficace !';
  if (n === 1) return 'Efficacité normale';
  if (n <= 0.25) return 'Presque sans effet…';
  return 'Pas très efficace…';
}

/** Le détail type par type : Eau → Feu ×2, Eau → Vol ×1. */
export function detail(attaque: number, defense: readonly number[]) {
  return defense.map((d) => ({ type: TYPES[d - 1], f: effectiveness(attaque, [d]) }));
}

/** Tire une question : un attaquant et un défenseur à un ou deux types. */
export function tirage(rand: () => number = Math.random): { attaque: number; defense: number[] } {
  const pick = () => 1 + Math.floor(rand() * TYPES.length);
  const attaque = pick();
  const a = pick();
  let b = pick();
  if (rand() < 0.5) return { attaque, defense: [a] };
  while (b === a) b = 1 + (b % TYPES.length);
  return { attaque, defense: [a, b] };
}
