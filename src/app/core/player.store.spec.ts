import { TestBed } from '@angular/core/testing';
import { CRAFT_COST, DUPLICATE_DUST, POKEBALLS_MATIN, PlayerStore, dailyNumber, migrer } from './player.store';
import { Pokemon } from './pokemon';

const poke = (id: number, sum = 300): Pokemon => ({ id, name: 'P' + id, types: [1], gen: 1, stats: [sum, 0, 0, 0, 0, 0], height: 1, weight: 10, shape: 1, rank: 0, from: 0, chain: id, level: 0, learn: [1, 33], xp: 60, growth: 2 });

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

  it('accueille un nouveau visiteur, puis retient son dresseur', () => {
    expect(store.nouveau()).toBe(true);
    store.setDresseur('  Patrick  ', 'fillette');
    expect(store.dresseur()).toEqual({ nom: 'Patrick', avatar: 'fillette' });
    expect(store.nouveau()).toBe(false);
  });

  it('ne redemande plus l’accueil à qui a choisi d’explorer', () => {
    store.passerAccueil();
    expect(store.nouveau()).toBe(false);
  });

  it('donne 5 Pokéballs, en retire une par lancer et en rend une par victoire', () => {
    expect(store.pokeballs()).toBe(POKEBALLS_MATIN);
    for (let i = 0; i < POKEBALLS_MATIN; i++) expect(store.utiliserPokeball()).toBe(true);
    expect(store.pokeballs()).toBe(0);
    expect(store.utiliserPokeball()).toBe(false);
    store.gagnerPokeball();
    expect(store.pokeballs()).toBe(1);
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

  it('fait monter une carte de niveau selon la courbe des jeux', () => {
    store.addCard(1, false);
    expect(store.owned()[1]).toMatchObject({ level: 5, xp: 125 });
    expect(store.gainCardXp(1, 91, 2, [33])).toEqual({ avant: 5, apres: 6 });
    expect(store.owned()[1]).toMatchObject({ level: 6, xp: 216, moves: [33] });
  });

  it('apprend une 5e capacité à la place de celle qu’on oublie', () => {
    store.addCard(1, false);
    store.apprendre(1, 52, [33]);
    expect(store.owned()[1].moves).toEqual([33, 52]);
    store.apprendre(1, 84, []);
    store.apprendre(1, 98, []);
    store.apprendre(1, 10, []);
    expect(store.owned()[1].moves).toEqual([33, 52, 84, 98]);
    store.apprendre(1, 53, [], 52);
    expect(store.owned()[1].moves).toEqual([33, 53, 84, 98]);
  });

  it('reprend les anciennes sauvegardes au barème des jeux', () => {
    const ancien = { ...store.snapshot(), version: undefined, owned: { 4: { xp: 30, level: 3, shiny: false, count: 1 } } };
    expect(migrer(ancien).owned[4]).toMatchObject({ level: 13, xp: 2197 });
    expect(migrer(ancien).version).toBe(2);
  });

  it('fait évoluer une carte en gardant son niveau et sa place dans l’équipe', () => {
    store.chooseStarter(4);
    store.gainCardXp(4, 2000, 4);
    const niveau = store.owned()[4].level;
    store.evolve(4, 5);
    expect(store.isOwned(4)).toBe(false);
    expect(store.owned()[5].level).toBe(niveau);
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
