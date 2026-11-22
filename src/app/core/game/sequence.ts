import { Action, TurnReport, Who } from './duel';

/**
 * Mise en scène d'un tour : qui gagne la révélation, puis la liste des coups dans l'ordre.
 * Fonction pure, à partir du rapport du moteur : l'arène se contente de la jouer.
 */
export interface Coup {
  attaquant: Who;
  cible: Who;
  action: Exclude<Action, 'garde'>;
  degats: number;
  /** Efficacité de la technique (1 pour une Frappe). */
  efficacite: number;
  /** Tampon posé sur la scène : PARÉ !, GARDE PERCÉE !, PLUS RAPIDE !, SUPER EFFICACE !… */
  tampon: string | null;
}

export interface Sequence {
  /** Celui dont le geste l'emporte au pierre-feuille-ciseaux, null en cas d'égalité. */
  gagnant: Who | null;
  coups: Coup[];
  /** Phrase quand personne n'attaque (deux Gardes). */
  note: string | null;
}

const BEATS: Record<Action, Action> = { frappe: 'garde', tech: 'frappe', garde: 'tech' };
const autre = (w: Who): Who => (w === 'player' ? 'machine' : 'player');

export function tamponEfficacite(e: number): string | null {
  if (e === 0) return 'AUCUN EFFET';
  if (e >= 2) return 'SUPER EFFICACE !';
  if (e < 1) return 'PEU EFFICACE';
  return null;
}

export function sequence(r: TurnReport): Sequence {
  const action = (w: Who) => (w === 'player' ? r.player : r.machine);
  const degatsDe = (w: Who) => (w === 'player' ? r.toMachine : r.toPlayer);
  const effDe = (w: Who) => (w === 'player' ? r.playerEffect : r.machineEffect);
  const coup = (w: Who, tampon: string | null): Coup => {
    const a = action(w) as Exclude<Action, 'garde'>;
    const eff = a === 'tech' ? effDe(w) : 1;
    return { attaquant: w, cible: autre(w), action: a, degats: degatsDe(w), efficacite: eff, tampon: tampon ?? (a === 'tech' ? tamponEfficacite(eff) : null) };
  };

  if (r.player === r.machine) {
    if (r.player === 'garde') return { gagnant: null, coups: [], note: 'Deux Gardes : tout le monde recharge.' };
    const premier = r.first ?? 'player';
    const coups = [coup(premier, 'PLUS RAPIDE !')];
    if (degatsDe(autre(premier)) > 0) coups.push(coup(autre(premier), null));
    return { gagnant: null, coups, note: null };
  }

  const gagnant: Who = BEATS[r.player] === r.machine ? 'player' : 'machine';
  const perdant = autre(gagnant);
  const g = action(gagnant);
  // La Garde gagnante pare la technique : le coup part quand même, sans dégâts.
  if (g === 'garde') return { gagnant, coups: [{ ...coup(perdant, 'PARÉ !'), degats: 0 }], note: null };
  if (g === 'frappe') return { gagnant, coups: [coup(gagnant, 'GARDE PERCÉE !')], note: null };
  return { gagnant, coups: [coup(gagnant, null)], note: null };
}
