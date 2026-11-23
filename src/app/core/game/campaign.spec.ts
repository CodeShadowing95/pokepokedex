import data from '../../../../public/data/pokedex.json';
import { Pokemon } from '../pokemon';
import { GYMS, LEAGUE, STARTERS, companions, gymTeam, rivalTeam } from './campaign';
import { cardOf, evolutionLevel, total } from './cards';

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
  it('donne à chaque Pokémon de une à quatre vraies capacités offensives, dont une de son type', () => {
    expect(all.every((p) => p.moves.length >= 1 && p.moves.length <= 4)).toBe(true);
    const dracaufeu = cardOf(byId(6));
    expect(dracaufeu.moves.map((m) => m.nom)).toContain('Lance-Flammes');
    expect(dracaufeu.moves.every((m) => m.puissance > 0 && m.pp > 0)).toBe(true);
  });
  it('calcule les statistiques avec la formule des jeux', () => {
    const c = cardOf(byId(4)); // Salamèche, niveau de combat 42
    expect(c.level).toBe(42);
    expect(c.hp).toBe(Math.floor(((2 * 39 + 31) * 42) / 100) + 42 + 10);
    expect(cardOf(byId(4), 3).hp).toBeGreaterThan(c.hp);
  });
  it('place l’évolution à un niveau de carte entre 2 et 8', () => {
    expect(evolutionLevel(byId(5))).toBe(2);
    expect(all.every((p) => evolutionLevel(p) >= 2 && evolutionLevel(p) <= 8)).toBe(true);
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
  it('rend les arènes de plus en plus fortes', () => {
    const power = (gym: number) => gymTeam(all, 1, gym).reduce((s, c) => s + total(byId(c.id)), 0);
    expect(power(8)).toBeGreaterThan(power(1));
  });
  it('donne deux compagnons par région et un rival de trois cartes', () => {
    for (let region = 1; region <= 9; region++) expect(companions(all, region)).toHaveLength(2);
    expect(rivalTeam(all, 310)).toHaveLength(3);
  });
});
