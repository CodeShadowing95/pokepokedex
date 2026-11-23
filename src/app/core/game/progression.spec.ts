import data from '../../../../public/data/pokedex.json';
import { Pokemon } from '../pokemon';
import { avancee, capacitesParDefaut, evolutionAuNiveau, experienceGagnee, experiencePour, niveauPour, nouvellesCapacites } from './progression';

const all = data as Pokemon[];
const byId = (id: number) => all.find((p) => p.id === id)!;

describe('progression à la manière des jeux', () => {
  it('suit les six courbes d’expérience', () => {
    expect(experiencePour(2, 100)).toBe(1_000_000);
    expect(experiencePour(1, 100)).toBe(1_250_000);
    expect(experiencePour(3, 100)).toBe(800_000);
    expect(experiencePour(4, 100)).toBe(1_059_860);
    expect(experiencePour(5, 100)).toBe(600_000);
    expect(experiencePour(6, 100)).toBe(1_640_000);
    for (const g of [1, 2, 3, 4, 5, 6]) for (let n = 2; n <= 100; n++) expect(experiencePour(g, n)).toBeGreaterThan(experiencePour(g, n - 1));
  });

  it('retrouve le niveau à partir de l’expérience', () => {
    expect(niveauPour(2, 125)).toBe(5);
    expect(niveauPour(2, 215)).toBe(5);
    expect(niveauPour(2, 216)).toBe(6);
    expect(avancee(2, 5, 125)).toBe(0);
    expect(avancee(2, 5, 170)).toBeCloseTo(0.494, 2);
  });

  it('donne plus d’expérience contre un dresseur et un adversaire de haut niveau', () => {
    const rattata = byId(19);
    expect(experienceGagnee(rattata, 10, true)).toBeGreaterThan(experienceGagnee(rattata, 10, false));
    expect(experienceGagnee(rattata, 20, false)).toBeGreaterThan(experienceGagnee(rattata, 10, false));
  });

  it('apprend les capacités au bon niveau et garde les quatre dernières', () => {
    const salameche = byId(4);
    expect(capacitesParDefaut(salameche, 5).length).toBeGreaterThanOrEqual(1);
    expect(capacitesParDefaut(salameche, 100)).toHaveLength(4);
    const connues = capacitesParDefaut(salameche, 10);
    expect(nouvellesCapacites(salameche, 10, 20, connues).length).toBeGreaterThan(0);
    expect(nouvellesCapacites(salameche, 10, 10, connues)).toEqual([]);
  });

  it('propose l’évolution au niveau des jeux', () => {
    const reptincel = byId(5);
    expect(evolutionAuNiveau([reptincel], 15)).toBeNull();
    expect(evolutionAuNiveau([reptincel], 16)).toBe(reptincel);
    expect(evolutionAuNiveau([byId(136)], 50)).toBeNull(); // pierre : pas d'évolution automatique
  });
});
