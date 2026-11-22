import { effectiveness } from '../types';
import { Card } from './cards';

/**
 * Moteur du Duel Éclair. Aucune dépendance à Angular ni au navigateur :
 * des fonctions pures (mêmes entrées, mêmes sorties), donc faciles à tester et à simuler.
 */
export type Action = 'frappe' | 'tech' | 'garde';
export type Who = 'player' | 'machine';

export interface Fighter {
  card: Card;
  hp: number;
}

export interface Side {
  team: Fighter[];
  active: number;
  energy: number;
}

export interface DuelRules {
  startEnergy: number;
  energyPerTurn: number;
  maxEnergy: number;
}

export interface DuelState {
  player: Side;
  machine: Side;
  turn: number;
  /** Actions du joueur, de la plus ancienne à la plus récente. L'IA s'en sert pour le lire. */
  history: Action[];
  winner: Who | null;
  rules: DuelRules;
}

export interface TurnReport {
  player: Action;
  machine: Action;
  toPlayer: number;
  toMachine: number;
  /** Efficacité de la technique lancée par chacun (1 si aucune technique). */
  playerEffect: number;
  machineEffect: number;
  first: Who | null;
  koPlayer: boolean;
  koMachine: boolean;
  /** Carte qui a porté le coup fatal côté joueur, pour lui donner son expérience. */
  scorer: number | null;
  message: string;
}

export const DEFAULT_RULES: DuelRules = { startEnergy: 1, energyPerTurn: 1, maxEnergy: 5 };
const BEATS: Record<Action, Action> = { frappe: 'garde', tech: 'frappe', garde: 'tech' };
const COUNTER: Record<Action, Action> = { frappe: 'tech', tech: 'garde', garde: 'frappe' };

export function createDuel(player: Card[], machine: Card[], rules: Partial<DuelRules> = {}): DuelState {
  const r = { ...DEFAULT_RULES, ...rules };
  const side = (cards: Card[]): Side => ({ team: cards.map((card) => ({ card, hp: card.hp })), active: 0, energy: r.startEnergy });
  return { player: side(player), machine: side(machine), turn: 1, history: [], winner: null, rules: r };
}

export const active = (side: Side): Fighter => side.team[side.active];
export const canUseTech = (side: Side): boolean => side.energy >= active(side).card.tech.cost;

export function strikeDamage(att: Card, guardBroken = false): number {
  return Math.round(att.atk * 0.22 * (guardBroken ? 1.5 : 1));
}

export function techDamage(att: Card, def: Card): number {
  return Math.round(((att.atk * att.tech.power) / 100) * 0.5 * effectiveness(att.tech.type, def.types));
}

/** Joue une manche et renvoie le nouvel état sans modifier l'ancien. */
export function resolve(state: DuelState, playerAction: Action, machineAction: Action): { state: DuelState; report: TurnReport } {
  if (state.winner) throw new Error('Le duel est terminé.');
  const next: DuelState = structuredClone(state);
  const P = active(next.player), M = active(next.machine);
  if (playerAction === 'tech' && !canUseTech(next.player)) throw new Error('Énergie insuffisante.');
  if (machineAction === 'tech' && !canUseTech(next.machine)) throw new Error('Énergie insuffisante (machine).');

  if (playerAction === 'tech') next.player.energy -= P.card.tech.cost;
  if (machineAction === 'tech') next.machine.energy -= M.card.tech.cost;

  const hit = (att: Card, def: Card, action: Action, broken = false) => (action === 'tech' ? techDamage(att, def) : strikeDamage(att, broken));
  let toPlayer = 0, toMachine = 0, first: Who | null = null, message: string;

  if (playerAction === machineAction) {
    if (playerAction === 'garde') message = 'Deux Gardes : personne ne bouge, tout le monde recharge.';
    else {
      first = P.card.spd >= M.card.spd ? 'player' : 'machine';
      if (first === 'player') {
        toMachine = hit(P.card, M.card, playerAction);
        if (M.hp - toMachine > 0) toPlayer = hit(M.card, P.card, machineAction);
      } else {
        toPlayer = hit(M.card, P.card, machineAction);
        if (P.hp - toPlayer > 0) toMachine = hit(P.card, M.card, playerAction);
      }
      message = `Échange de coups ! ${(first === 'player' ? P : M).card.name} est plus rapide.`;
    }
  } else if (BEATS[playerAction] === machineAction) {
    if (playerAction === 'garde') { next.player.energy += 2; message = `Ta Garde absorbe ${M.card.tech.name} !`; }
    else if (playerAction === 'frappe') { toMachine = hit(P.card, M.card, 'frappe', true); message = 'Ta Frappe perce sa Garde !'; }
    else { toMachine = hit(P.card, M.card, 'tech'); message = `${P.card.tech.name} écrase sa Frappe !`; }
  } else {
    if (machineAction === 'garde') { next.machine.energy += 2; message = 'Sa Garde absorbe ta technique.'; }
    else if (machineAction === 'frappe') { toPlayer = hit(M.card, P.card, 'frappe', true); message = 'Sa Frappe perce ta Garde.'; }
    else { toPlayer = hit(M.card, P.card, 'tech'); message = `${M.card.tech.name} écrase ta Frappe.`; }
  }

  const playerEffect = playerAction === 'tech' ? effectiveness(P.card.tech.type, M.card.types) : 1;
  const machineEffect = machineAction === 'tech' ? effectiveness(M.card.tech.type, P.card.types) : 1;
  if (playerAction === 'tech' && toMachine > 0 && playerEffect >= 2) message += ` Super efficace ×${playerEffect} !`;
  if (playerAction === 'tech' && toMachine > 0 && playerEffect < 1) message += ' Peu efficace.';
  if (playerAction === 'tech' && playerEffect === 0) message = `Aucun effet sur ${M.card.name}… change de plan.`;

  if (playerAction === 'garde') next.player.energy += 1;
  if (machineAction === 'garde') next.machine.energy += 1;
  const { energyPerTurn, maxEnergy } = next.rules;
  next.player.energy = Math.min(maxEnergy, next.player.energy + energyPerTurn);
  next.machine.energy = Math.min(maxEnergy, next.machine.energy + energyPerTurn);

  M.hp = Math.max(0, M.hp - toMachine);
  P.hp = Math.max(0, P.hp - toPlayer);
  next.history.push(playerAction);

  const koMachine = M.hp === 0, koPlayer = P.hp === 0;
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

  return {
    state: next,
    report: { player: playerAction, machine: machineAction, toPlayer, toMachine, playerEffect, machineEffect, first, koPlayer, koMachine, scorer: koMachine ? P.card.id : null, message },
  };
}

/**
 * Choix de la machine. Elle regarde les 4 dernières actions du joueur, parie sur la plus fréquente
 * et joue ce qui la bat. `skill` (0 à 1) règle la part de lecture face au hasard.
 */
export function chooseMachineAction(state: DuelState, random: () => number = Math.random, skill = 0.6): Action {
  const can = canUseTech(state.machine);
  const options: Action[] = can ? ['frappe', 'tech', 'garde'] : ['frappe', 'garde'];
  const recent = state.history.slice(-4);
  if (recent.length >= 2 && random() < skill) {
    const count = (a: Action) => recent.filter((h) => h === a).length;
    const predicted = (['garde', 'tech', 'frappe'] as Action[]).reduce((best, a) => (count(a) > count(best) ? a : best), 'frappe' as Action);
    const answer = COUNTER[predicted];
    if (options.includes(answer)) return answer;
  }
  if (can && state.machine.energy >= 4 && random() < 0.6) return 'tech';
  return options[Math.floor(random() * options.length)];
}

/** Ce que la machine « pense » du joueur, affiché dans l'arène. */
export function machineMood(history: Action[]): string {
  const recent = history.slice(-4);
  if (recent.length < 2) return 'observe';
  const count = (a: Action) => recent.filter((h) => h === a).length;
  if (count('garde') >= 2) return 'te croit prudent';
  if (count('tech') >= 2) return 'attend ta technique';
  if (count('frappe') >= 2) return 'te trouve agressif';
  return 'hésite';
}
