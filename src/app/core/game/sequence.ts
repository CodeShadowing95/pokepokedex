import { Coup } from './duel';

/** Tampon posé sur la scène après un coup : RATÉ !, COUP CRITIQUE !, SUPER EFFICACE !… */
export function tampon(c: Coup): string | null {
  if (!c.touche) return 'RATÉ !';
  if (c.efficacite === 0) return 'AUCUN EFFET';
  const bits = [c.critique ? 'COUP CRITIQUE !' : null, c.efficacite >= 2 ? 'SUPER EFFICACE !' : c.efficacite < 1 ? 'PEU EFFICACE' : null];
  return bits.filter(Boolean).join(' · ') || null;
}
