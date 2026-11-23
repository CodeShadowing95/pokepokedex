import data from '../../../public/data/pokedex.json';
import { total } from './game/cards';
import { Pokemon } from './pokemon';
import { pageOuverte, tirerSauvage } from './rencontre';

const all = data as Pokemon[];

describe('rencontres sauvages', () => {
  it('ne surgissent ni pendant un duel ni pendant l’accueil', () => {
    expect(pageOuverte('/pokedex')).toBe(true);
    expect(pageOuverte('/pokemon/25')).toBe(true);
    expect(pageOuverte('/arene?sauvage=16')).toBe(false);
    expect(pageOuverte('/bienvenue')).toBe(false);
  });

  it('tirent un Pokémon non légendaire de puissance voisine', () => {
    for (let i = 0; i < 50; i++) {
      const p = tirerSauvage(all, 320)!;
      expect(p.rank).toBe(0);
      expect(Math.abs(total(p) - 320)).toBeLessThanOrEqual(90);
    }
  });
});
