import { effectiveness } from '../types';
import { Card } from './cards';
import { chooseMachineAction, createDuel, resolve, strikeDamage, techDamage } from './duel';

const card = (over: Partial<Card> = {}): Card => ({
  id: 1, name: 'Test', types: [1], hp: 100, atk: 100, spd: 50,
  tech: { name: 'Technique', type: 1, power: 80, cost: 2 },
  ...over,
});

describe('table des types', () => {
  it('multiplie les deux types du défenseur', () => {
    expect(effectiveness(6, [10, 3])).toBe(4); // Roche contre Feu/Vol
    expect(effectiveness(5, [10, 3])).toBe(0); // Sol contre Vol
    expect(effectiveness(11, [16, 5])).toBe(1); // Eau contre Dragon/Sol
  });
});

describe('Duel Éclair', () => {
  it('la Frappe perce la Garde avec un bonus de 50 %', () => {
    const duel = createDuel([card()], [card()]);
    const { state, report } = resolve(duel, 'frappe', 'garde');
    expect(report.toMachine).toBe(strikeDamage(card(), true));
    expect(report.toPlayer).toBe(0);
    expect(state.machine.team[0].hp).toBe(100 - 33);
  });

  it('la Garde absorbe la Technique et recharge', () => {
    const duel = createDuel([card()], [card()], { startEnergy: 2 });
    const { state, report } = resolve(duel, 'garde', 'tech');
    expect(report.toPlayer).toBe(0);
    expect(state.player.energy).toBe(5); // 2 + 2 (absorbe) + 1 (garde) + 1 (manche), plafonné à 5
    expect(state.machine.energy).toBe(1); // 2 − 2 (coût) + 1 (manche)
  });

  it('la Technique écrase la Frappe', () => {
    const duel = createDuel([card()], [card()], { startEnergy: 2 });
    const { report } = resolve(duel, 'tech', 'frappe');
    expect(report.toMachine).toBe(techDamage(card(), card()));
    expect(report.toPlayer).toBe(0);
  });

  it('à action égale, le plus rapide frappe en premier et peut empêcher la riposte', () => {
    const fast = card({ spd: 90, atk: 500 });
    const duel = createDuel([fast], [card({ hp: 50 })]);
    const { state, report } = resolve(duel, 'frappe', 'frappe');
    expect(report.first).toBe('player');
    expect(report.toPlayer).toBe(0);
    expect(state.winner).toBe('player');
  });

  it('refuse une technique sans énergie', () => {
    const duel = createDuel([card()], [card()], { startEnergy: 0 });
    expect(() => resolve(duel, 'tech', 'frappe')).toThrow();
  });

  it('ne modifie jamais l’état reçu', () => {
    const duel = createDuel([card()], [card()]);
    const copy = structuredClone(duel);
    resolve(duel, 'frappe', 'frappe');
    expect(duel).toEqual(copy);
  });

  it('envoie la carte suivante après un K.O.', () => {
    const duel = createDuel([card({ atk: 900 })], [card({ hp: 10, name: 'A' }), card({ name: 'B' })]);
    const { state, report } = resolve(duel, 'frappe', 'garde');
    expect(report.koMachine).toBe(true);
    expect(state.machine.active).toBe(1);
    expect(state.winner).toBeNull();
  });

  it('la machine contre un joueur qui garde toujours', () => {
    let duel = createDuel([card()], [card({ hp: 9999 })]);
    duel = { ...duel, history: ['garde', 'garde', 'garde'] };
    expect(chooseMachineAction(duel, () => 0, 1)).toBe('frappe');
  });

  it('une partie jouée au hasard se termine toujours', () => {
    let seed = 42;
    const random = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
    let duel = createDuel([card(), card(), card()], [card(), card(), card()]);
    for (let i = 0; i < 500 && !duel.winner; i++) {
      const options = duel.player.energy >= 2 ? (['frappe', 'tech', 'garde'] as const) : (['frappe', 'garde'] as const);
      duel = resolve(duel, options[Math.floor(random() * options.length)], chooseMachineAction(duel, random)).state;
    }
    expect(duel.winner).not.toBeNull();
  });
});
