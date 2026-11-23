import { TestBed } from '@angular/core/testing';
import { CRAFT_COST, DUPLICATE_DUST, PlayerStore, dailyNumber } from './player.store';
import { Pokemon } from './pokemon';

const poke = (id: number, sum = 300): Pokemon => ({ id, name: 'P' + id, types: [1], gen: 1, stats: [sum, 0, 0, 0, 0, 0], height: 1, weight: 10, shape: 1, rank: 0, from: 0, chain: id, level: 0, moves: [33] });

describe('PlayerStore', () => {
  let store: PlayerStore;
  beforeEach(() => {
    localStorage.clear();
    store = TestBed.inject(PlayerStore);
    store.reset();
  });

  it('ajoute le starter à la collection et à l’équipe', () => {
    store.chooseStarter(4);
    expect(store.isOwned(4)).toBe(true);
    expect(store.deck()).toEqual([4]);
  });

  it('transforme un doublon en poussière', () => {
    expect(store.addCard(1, false)).toBe(true);
    expect(store.addCard(1, false)).toBe(false);
    expect(store.dust()).toBe(DUPLICATE_DUST);
  });

  it('refuse de fabriquer sans assez de poussière', () => {
    expect(store.craft(7)).toBe(false);
    for (let i = 0; i <= CRAFT_COST / DUPLICATE_DUST; i++) store.addCard(1, false);
    expect(store.craft(7)).toBe(true);
    expect(store.dust()).toBe(0);
  });

  it('fait monter une carte de niveau tous les 100 XP', () => {
    store.addCard(1, false);
    store.gainCardXp(1, 250);
    expect(store.owned()[1]).toMatchObject({ level: 3, xp: 50 });
  });

  it('fait évoluer une carte en gardant son niveau et sa place dans l’équipe', () => {
    store.chooseStarter(4);
    store.gainCardXp(4, 200);
    store.evolve(4, 5);
    expect(store.isOwned(4)).toBe(false);
    expect(store.owned()[5].level).toBe(3);
    expect(store.deck()).toEqual([5]);
    expect(store.starter()).toBe(5);
  });

  it('ouvre un seul booster de cinq cartes par jour', () => {
    const all = [poke(1, 300), poke(2, 420), poke(3, 520), { ...poke(4, 600), rank: 1 }];
    expect(store.openBooster(all)).toHaveLength(5);
    expect(store.boosterReady()).toBe(false);
    expect(store.openBooster(all)).toHaveLength(0);
  });

  it('limite le mystère à trois essais', () => {
    store.guessMystery(false); store.guessMystery(false); store.guessMystery(false); store.guessMystery(true);
    expect(store.mystery()).toMatchObject({ tries: 3, solved: false });
  });

  it('tire le même nombre pour un même jour', () => {
    expect(dailyNumber('2026-11-22', 'mystery', 1025)).toBe(dailyNumber('2026-11-22', 'mystery', 1025));
  });
});
