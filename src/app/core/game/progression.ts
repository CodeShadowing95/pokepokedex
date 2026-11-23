import { Pokemon } from '../pokemon';
import { CAPACITES } from './capacites';

/**
 * La progression des Pokémon, avec les règles des jeux : courbes d'expérience, expérience gagnée
 * à chaque K.O., capacités apprises en montant de niveau, niveau d'évolution.
 * Des fonctions pures, sans Angular.
 */

export const NIVEAU_DEPART = 5;
export const NIVEAU_MAX = 100;
/** Les évolutions qui ne passent pas par un niveau (pierre, échange, amitié…) s'ouvrent à ce niveau. */
export const NIVEAU_AUTRE_EVOLUTION = 30;
/** Part d'expérience des Pokémon de l'équipe restés sur le banc (comme le Multi Exp. des jeux récents). */
export const PART_BANC = 0.5;

/** Expérience totale qu'il faut pour être au niveau `n`, selon la courbe de l'espèce. */
export function experiencePour(growth: number, n: number): number {
  if (n <= 1) return 0;
  const c = n ** 3;
  switch (growth) {
    case 1: return Math.floor((5 * c) / 4);
    case 3: return Math.floor((4 * c) / 5);
    case 4: return Math.max(0, Math.floor((6 * c) / 5 - 15 * n * n + 100 * n - 140));
    case 5:
      if (n < 50) return Math.floor((c * (100 - n)) / 50);
      if (n < 68) return Math.floor((c * (150 - n)) / 100);
      if (n < 98) return Math.floor((c * Math.floor((1911 - 10 * n) / 3)) / 500);
      return Math.floor((c * (160 - n)) / 100);
    case 6:
      if (n < 15) return Math.floor((c * (Math.floor((n + 1) / 3) + 24)) / 50);
      if (n < 36) return Math.floor((c * (n + 14)) / 50);
      return Math.floor((c * (Math.floor(n / 2) + 32)) / 50);
    default: return c;
  }
}

/** Le niveau atteint avec `xp` points d'expérience au total. */
export function niveauPour(growth: number, xp: number): number {
  let n = 1;
  while (n < NIVEAU_MAX && experiencePour(growth, n + 1) <= xp) n++;
  return n;
}

/** Avancée vers le niveau suivant, de 0 à 1. */
export function avancee(growth: number, niveau: number, xp: number): number {
  if (niveau >= NIVEAU_MAX) return 1;
  const bas = experiencePour(growth, niveau), haut = experiencePour(growth, niveau + 1);
  return Math.min(1, Math.max(0, (xp - bas) / (haut - bas)));
}

/** Expérience donnée par un K.O. (formule de la 4e génération ; ×1,5 face à un dresseur). */
export function experienceGagnee(vaincu: Pokemon, niveauVaincu: number, dresseur: boolean): number {
  return Math.max(1, Math.floor(((dresseur ? 1.5 : 1) * vaincu.xp * niveauVaincu) / 7));
}

/** Les capacités apprises par niveau, sans doublon. */
export function apprentissages(p: Pokemon): { niveau: number; id: number }[] {
  const out: { niveau: number; id: number }[] = [];
  const learn = p.learn ?? [];
  for (let i = 0; i + 1 < learn.length; i += 2) if (CAPACITES[learn[i + 1]]) out.push({ niveau: learn[i], id: learn[i + 1] });
  return out;
}

/** Comme dans les jeux : les quatre dernières capacités apprises jusqu'à ce niveau (Charge s'il n'y en a aucune). */
export function capacitesParDefaut(p: Pokemon, niveau: number): number[] {
  const ids = apprentissages(p).filter((a) => a.niveau <= niveau).map((a) => a.id);
  const uniques = [...new Set(ids.reverse())].slice(0, 4).reverse();
  return uniques.length ? uniques : [33];
}

/** Les capacités qu'il découvre en passant du niveau `de` au niveau `a` (exclu, inclus). */
export function nouvellesCapacites(p: Pokemon, de: number, a: number, connues: number[]): number[] {
  return [...new Set(apprentissages(p).filter((x) => x.niveau > de && x.niveau <= a && !connues.includes(x.id)).map((x) => x.id))];
}

/** Niveau à atteindre pour évoluer vers `cible`. */
export function niveauEvolution(cible: Pokemon): number {
  return cible.level || NIVEAU_AUTRE_EVOLUTION;
}

/** L'évolution par niveau qu'un Pokémon peut faire à ce niveau, s'il y en a une. */
export function evolutionAuNiveau(evolutions: Pokemon[], niveau: number): Pokemon | null {
  return evolutions.find((e) => e.level > 0 && niveau >= e.level) ?? null;
}
