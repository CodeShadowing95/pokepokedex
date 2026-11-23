import { effectiveness } from '../types';
import { Card, Move } from './cards';

/**
 * Moteur du duel, à la manière des jeux : chacun choisit une capacité, la plus prioritaire puis
 * la plus rapide part en premier, et chaque attaque peut rater ou faire un coup critique.
 * Aucune dépendance à Angular ni au navigateur : des fonctions pures, le hasard est passé en paramètre.
 */
export type Who = 'player' | 'machine';
export type Rand = () => number;

export interface Fighter {
  card: Card;
  hp: number;
  /** PP restants, dans l'ordre des capacités de la carte. */
  pp: number[];
}

export interface Side {
  team: Fighter[];
  active: number;
}

export interface DuelState {
  player: Side;
  machine: Side;
  turn: number;
  winner: Who | null;
}

/** Un coup porté pendant la manche. */
export interface Coup {
  attaquant: Who;
  cible: Who;
  move: Move;
  touche: boolean;
  critique: boolean;
  /** Multiplicateur des types (1 = normal). */
  efficacite: number;
  degats: number;
  ko: boolean;
}

export interface TurnReport {
  /** Dans l'ordre où ils ont été joués. */
  coups: Coup[];
  koPlayer: boolean;
  koMachine: boolean;
  /** Carte du joueur qui a mis l'adversaire K.O., pour lui donner son expérience. */
  scorer: number | null;
  message: string;
}

/** Choix « Lutte » : quand plus aucune capacité n'a de PP. */
export const STRUGGLE = -1;
export const LUTTE: Move = { id: 165, nom: 'Lutte', type: 1, puissance: 50, precision: null, pp: 1, classe: 'physique', priorite: 0 };
export const CRITIQUE = 1 / 24;

export function createDuel(player: Card[], machine: Card[]): DuelState {
  const side = (cards: Card[]): Side => ({ team: cards.map((card) => ({ card, hp: card.hp, pp: card.moves.map((m) => m.pp) })), active: 0 });
  return { player: side(player), machine: side(machine), turn: 1, winner: null };
}

export const active = (side: Side): Fighter => side.team[side.active];
export const other = (w: Who): Who => (w === 'player' ? 'machine' : 'player');

/** Indices des capacités encore utilisables ; vide = il ne reste que Lutte. */
export const usable = (f: Fighter): number[] => f.pp.flatMap((pp, i) => (pp > 0 ? [i] : []));

const moveFor = (f: Fighter, choice: number): Move => (choice === STRUGGLE ? LUTTE : f.card.moves[choice]);

/** Efficacité d'une capacité sur une carte (Lutte n'a pas de type). */
export const typeFactor = (move: Move, def: Card): number => (move === LUTTE ? 1 : effectiveness(move.type, def.types));

/** Dégâts de base de la formule des jeux, avant critique, hasard, bonus de même type et types. */
export function baseDamage(att: Card, def: Card, move: Move): number {
  const physique = move.classe === 'physique';
  const A = physique ? att.atk : att.spa;
  const D = physique ? def.def : def.spdef;
  return Math.floor(Math.floor((Math.floor((2 * att.level) / 5 + 2) * move.puissance * A) / D) / 50) + 2;
}

export const stab = (att: Card, move: Move): number => (move !== LUTTE && att.types.includes(move.type) ? 1.5 : 1);

export function damage(att: Card, def: Card, move: Move, critique: boolean, rand: Rand): number {
  const eff = typeFactor(move, def);
  if (eff === 0) return 0;
  const hasard = (85 + Math.floor(rand() * 16)) / 100;
  return Math.max(1, Math.floor(baseDamage(att, def, move) * (critique ? 1.5 : 1) * hasard * stab(att, move) * eff));
}

/** Joue une manche et renvoie le nouvel état sans modifier l'ancien. */
export function resolve(state: DuelState, playerChoice: number, machineChoice: number, rand: Rand = Math.random): { state: DuelState; report: TurnReport } {
  if (state.winner) throw new Error('Le duel est terminé.');
  const next: DuelState = structuredClone(state);
  const fighters: Record<Who, Fighter> = { player: active(next.player), machine: active(next.machine) };
  const choices: Record<Who, number> = { player: playerChoice, machine: machineChoice };
  for (const w of ['player', 'machine'] as Who[]) {
    const f = fighters[w], c = choices[w];
    if (c === STRUGGLE ? usable(f).length > 0 : !(f.pp[c] > 0)) throw new Error(`Capacité indisponible (${w}).`);
  }
  const moves: Record<Who, Move> = { player: moveFor(fighters.player, playerChoice), machine: moveFor(fighters.machine, machineChoice) };

  // Ordre : priorité, puis vitesse, puis pile ou face.
  const p = moves.player.priorite - moves.machine.priorite;
  const v = fighters.player.card.spd - fighters.machine.card.spd;
  const first: Who = p > 0 || (p === 0 && (v > 0 || (v === 0 && rand() < 0.5))) ? 'player' : 'machine';

  const coups: Coup[] = [];
  for (const w of [first, other(first)]) {
    const att = fighters[w], def = fighters[other(w)];
    if (att.hp === 0) continue;
    if (choices[w] !== STRUGGLE) att.pp[choices[w]] -= 1;
    const move = moves[w];
    const touche = move.precision === null || rand() * 100 < move.precision;
    const critique = touche && rand() < CRITIQUE;
    const efficacite = typeFactor(move, def.card);
    const degats = touche ? Math.min(def.hp, damage(att.card, def.card, move, critique, rand)) : 0;
    def.hp -= degats;
    coups.push({ attaquant: w, cible: other(w), move, touche, critique, efficacite, degats, ko: def.hp === 0 });
  }

  const P = fighters.player, M = fighters.machine;
  const koMachine = M.hp === 0, koPlayer = P.hp === 0;
  let message = coups.map(phrase).join(' ');
  if (koMachine) {
    const i = next.machine.team.findIndex((f) => f.hp > 0);
    message = `${M.card.name} est K.O. !`;
    if (i < 0) next.winner = 'player';
    else { next.machine.active = i; message += ` La machine envoie ${next.machine.team[i].card.name}.`; }
  }
  if (koPlayer) {
    const i = next.player.team.findIndex((f) => f.hp > 0);
    message = koMachine ? `Double K.O. ! ${message}` : `${P.card.name} est K.O.`;
    if (i < 0) next.winner ??= 'machine';
    else { next.player.active = i; message += ` À toi, ${next.player.team[i].card.name} !`; }
  }
  if (!next.winner) next.turn += 1;

  return { state: next, report: { coups, koPlayer, koMachine, scorer: koMachine ? P.card.id : null, message } };
}

function phrase(c: Coup): string {
  if (!c.touche) return `${c.move.nom} rate sa cible.`;
  if (c.efficacite === 0) return `${c.move.nom} n'a aucun effet.`;
  const bits = [c.critique ? 'Coup critique !' : '', c.efficacite >= 2 ? "C'est super efficace !" : c.efficacite < 1 ? "Ce n'est pas très efficace." : ''];
  return `${c.move.nom} : −${c.degats} PV. ${bits.filter(Boolean).join(' ')}`.trim();
}

/** Dégâts moyens espérés d'une capacité, précision comprise : ce que la machine compare. */
export function expected(att: Card, def: Card, move: Move): number {
  return baseDamage(att, def, move) * 0.925 * stab(att, move) * typeFactor(move, def) * ((move.precision ?? 100) / 100);
}

/**
 * Choix de la machine. Avec une probabilité `skill` (0 à 1), elle prend la capacité qui fait
 * le plus de dégâts espérés ; sinon elle joue une capacité au hasard.
 */
export function chooseMachineMove(state: DuelState, rand: Rand = Math.random, skill = 0.6): number {
  const me = active(state.machine), foe = active(state.player);
  const options = usable(me);
  if (!options.length) return STRUGGLE;
  if (rand() < skill) return options.reduce((best, i) => (expected(me.card, foe.card, me.card.moves[i]) > expected(me.card, foe.card, me.card.moves[best]) ? i : best));
  return options[Math.floor(rand() * options.length)];
}
