import { Pokemon } from './pokemon';
import { total } from './game/cards';

/** Réglages des rencontres sauvages. */
export const RENCONTRE = {
  /** Temps de navigation avant la première rencontre possible. */
  premiere: 90_000,
  /** Écart minimal entre deux rencontres. */
  ecart: 5 * 60_000,
  /** Fréquence des tirages, et chance qu'un tirage donne une rencontre. */
  tirage: 20_000,
  chance: 0.35,
  parJour: 8,
  /** Sans réponse, le Pokémon repart. */
  patience: 15_000,
  chromatique: 1 / 40,
} as const;

/** Pages où l'on peut être surpris : pas pendant un duel, ni pendant l'accueil. */
export const pageOuverte = (url: string) => !/^\/(arene|bienvenue)(\/|\?|$)/.test(url);

/**
 * Tire un Pokémon sauvage : pas de légendaire, une puissance voisine de celle de l'équipe,
 * et les plus forts (les plus rares) sortent trois fois moins souvent.
 */
export function tirerSauvage(all: Pokemon[], puissanceEquipe: number, rand: () => number = Math.random): Pokemon | null {
  const pool = all.filter((p) => p.rank === 0 && Math.abs(total(p) - puissanceEquipe) <= 90);
  if (!pool.length) return null;
  const poids = pool.map((p) => (total(p) >= 500 ? 1 : 3));
  let r = rand() * poids.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= poids[i]; if (r < 0) return pool[i]; }
  return pool[pool.length - 1];
}
