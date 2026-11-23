import data from '../../../../public/data/pokedex.json';
import { Pokemon } from '../pokemon';
import { GYMS, LEAGUE, STARTERS, companions, gymTeam, rivalTeam } from './campaign';
import { cardOf, total } from './cards';
import { niveauArene } from './campaign';
import { capacitesParDefaut, niveauEvolution } from './progression';

// Les vraies données générées par scripts/build-data.mjs : on teste ce que le site livre.
const all = data as Pokemon[];
const byId = (id: number) => all.find((p) => p.id === id)!;

describe('données', () => {
  it('contient les 1 025 Pokémon, avec un nom français et six statistiques', () => {
    expect(all).toHaveLength(1025);
    expect(byId(133).name).toBe('Évoli');
    expect(all.every((p) => p.stats.length === 6 && p.types.length >= 1)).toBe(true);
  });
});

describe('cartes', () => {
  it('apprend à chaque Pokémon au moins une vraie capacité offensive, puis d’autres en montant de niveau', () => {
    expect(all.every((p) => capacitesParDefaut(p, 100).length >= 1 && capacitesParDefaut(p, 100).length <= 4)).toBe(true);
    const dracaufeu = cardOf(byId(6), 50);
    expect(dracaufeu.moves.every((m) => m.puissance > 0 && m.pp > 0)).toBe(true);
    expect(cardOf(byId(4), 5).moves.map((m) => m.nom)).toContain('Griffe');
    expect(cardOf(byId(4), 5).moves.length).toBeLessThan(cardOf(byId(4), 40).moves.length + 1);
  });
  it('calcule les statistiques avec la formule des jeux, au vrai niveau', () => {
    const c = cardOf(byId(4), 42);
    expect(c.level).toBe(42);
    expect(c.hp).toBe(Math.floor(((2 * 39 + 31) * 42) / 100) + 42 + 10);
    expect(cardOf(byId(4), 50).hp).toBeGreaterThan(c.hp);
    expect(cardOf(byId(4)).level).toBe(5);
  });
  it('fait évoluer au niveau des jeux', () => {
    expect(niveauEvolution(byId(5))).toBe(16);
    expect(niveauEvolution(byId(6))).toBe(36);
    expect(niveauEvolution(byId(136))).toBe(30); // Pyroli : pierre, ouvert au niveau 30
  });
});

describe('campagne', () => {
  it('prévoit 9 régions de 8 arènes et 3 starters par région', () => {
    expect(GYMS).toHaveLength(9);
    expect(GYMS.every((g) => g.length === 8)).toBe(true);
    expect(STARTERS.every((s, i) => s.length === 3 && s.every((id) => byId(id).gen === i + 1))).toBe(true);
  });
  it('compose chaque arène de trois Pokémon du bon type', () => {
    for (let region = 1; region <= 9; region++) {
      for (let gym = 1; gym <= 8; gym++) {
        const team = gymTeam(all, region, gym);
        expect(team).toHaveLength(3);
        expect(team.every((c) => c.types.includes(GYMS[region - 1][gym - 1].type))).toBe(true);
      }
      expect(gymTeam(all, region, LEAGUE)).toHaveLength(3);
    }
  });
  it('monte le niveau des champions d’arène en arène', () => {
    expect(gymTeam(all, 1, 1)[0].level).toBe(niveauArene(1));
    expect(niveauArene(8)).toBeGreaterThan(niveauArene(1));
    expect(niveauArene(LEAGUE)).toBeGreaterThan(niveauArene(8));
  });
  it('rend les arènes de plus en plus fortes', () => {
    const power = (gym: number) => gymTeam(all, 1, gym).reduce((s, c) => s + total(byId(c.id)), 0);
    expect(power(8)).toBeGreaterThan(power(1));
  });
  it('donne deux compagnons par région et un rival de trois cartes', () => {
    for (let region = 1; region <= 9; region++) expect(companions(all, region)).toHaveLength(2);
    expect(rivalTeam(all, 310)).toHaveLength(3);
  });
});
