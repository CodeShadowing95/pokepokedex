import { effectiveness } from '../types';
import { Card, Move } from './cards';
import { LUTTE, STRUGGLE, baseDamage, chooseMachineMove, createDuel, damage, resolve } from './duel';
import { tampon } from './sequence';

const mv = (over: Partial<Move> = {}): Move => ({ id: 1, nom: 'Écras’Face', type: 1, puissance: 40, precision: 100, pp: 35, classe: 'physique', priorite: 0, ...over });
const card = (over: Partial<Card> = {}): Card => ({
  id: 1, name: 'Test', types: [1], level: 50, hp: 150, atk: 100, def: 100, spa: 100, spdef: 100, spd: 50,
  moves: [mv()],
  ...over,
});
/** Hasard figé : touche toujours, jamais de critique, dégâts au maximum. */
const sans = () => 0.99;

describe('table des types', () => {
  it('multiplie les deux types du défenseur', () => {
    expect(effectiveness(6, [10, 3])).toBe(4); // Roche contre Feu/Vol
    expect(effectiveness(5, [10, 3])).toBe(0); // Sol contre Vol
    expect(effectiveness(11, [16, 5])).toBe(1); // Eau contre Dragon/Sol
  });
});

describe('duel à la manière des jeux', () => {
  it('suit la formule des dégâts des jeux', () => {
    // Niveau 50, puissance 40, Attaque = Défense : floor(floor(22 × 40 × 1) / 50) + 2 = 19
    expect(baseDamage(card(), card(), mv())).toBe(19);
    // Bonus de même type ×1,5, hasard au maximum
    expect(damage(card(), card(), mv(), false, sans)).toBe(28);
    expect(damage(card(), card(), mv(), true, sans)).toBe(42);
  });

  it('utilise l’Attaque Spé. pour une capacité spéciale', () => {
    const fort = card({ spa: 200 });
    expect(baseDamage(fort, card(), mv({ classe: 'speciale' }))).toBeGreaterThan(baseDamage(fort, card(), mv()));
  });

  it('le plus rapide frappe en premier et peut empêcher la riposte', () => {
    const vif = card({ id: 2, name: 'Vif', spd: 90, moves: [mv({ puissance: 250 })] });
    const lent = card({ id: 3, name: 'Lent', hp: 40 });
    const { report } = resolve(createDuel([vif], [lent]), 0, 0, sans);
    expect(report.coups).toHaveLength(1);
    expect(report.coups[0].attaquant).toBe('player');
    expect(report.koMachine).toBe(true);
  });

  it('la priorité passe devant la vitesse', () => {
    const vif = card({ spd: 200 });
    const prompt = card({ moves: [mv({ nom: 'Vive-Attaque', priorite: 1 })] });
    const { report } = resolve(createDuel([vif], [prompt]), 0, 0, sans);
    expect(report.coups[0].attaquant).toBe('machine');
  });

  it('une attaque peut rater selon sa précision', () => {
    const flou = card({ moves: [mv({ precision: 50 })] });
    const { report } = resolve(createDuel([flou], [card()]), 0, 0, () => 0.7);
    const coup = report.coups.find((c) => c.attaquant === 'player')!;
    expect(coup.touche).toBe(false);
    expect(coup.degats).toBe(0);
    expect(tampon(coup)).toBe('RATÉ !');
  });

  it('dépense un PP par capacité et passe à Lutte quand il n’en reste plus', () => {
    const duel = createDuel([card({ moves: [mv({ pp: 1 })] })], [card()]);
    const { state } = resolve(duel, 0, 0, sans);
    expect(state.player.team[0].pp[0]).toBe(0);
    expect(() => resolve(state, 0, 0, sans)).toThrow();
    const { report } = resolve(state, STRUGGLE, 0, sans);
    expect(report.coups.some((c) => c.move === LUTTE || c.move.nom === 'Lutte')).toBe(true);
  });

  it('ne modifie jamais l’état reçu', () => {
    const duel = createDuel([card()], [card()]);
    const copie = structuredClone(duel);
    resolve(duel, 0, 0, sans);
    expect(duel).toEqual(copie);
  });

  it('envoie la carte suivante après un K.O.', () => {
    const fort = card({ moves: [mv({ puissance: 250 })], spd: 99 });
    const { state, report } = resolve(createDuel([fort], [card({ hp: 10 }), card({ id: 9, name: 'Relève' })]), 0, 0, sans);
    expect(report.koMachine).toBe(true);
    expect(state.machine.active).toBe(1);
    expect(report.message).toContain('Relève');
  });

  it('la machine habile choisit la capacité la plus efficace', () => {
    const machine = card({ moves: [mv({ nom: 'Faible', puissance: 40 }), mv({ nom: 'Eau', type: 11, puissance: 80 })] });
    const duel = createDuel([card({ types: [10] })], [machine]);
    expect(chooseMachineMove(duel, () => 0, 1)).toBe(1);
  });

  it('une partie jouée au hasard se termine toujours', () => {
    let duel = createDuel([card(), card({ id: 2 })], [card({ id: 3 }), card({ id: 4 })]);
    for (let i = 0; i < 300 && !duel.winner; i++) {
      duel = resolve(duel, chooseMachineMove({ ...duel, machine: duel.player, player: duel.machine }, Math.random, 0), chooseMachineMove(duel)).state;
    }
    expect(duel.winner).not.toBeNull();
  });
});
