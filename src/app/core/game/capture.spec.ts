import { SEUIL_CAPTURE, capturable, chanceCapture, lancer, valeurCapture } from './capture';

describe('capture à la Pokéball', () => {
  it('ne s’ouvre que quand la jauge est rouge', () => {
    expect(capturable(100, 100)).toBe(false);
    expect(capturable(SEUIL_CAPTURE * 100, 100)).toBe(false);
    expect(capturable(29, 100)).toBe(true);
    expect(capturable(0, 100)).toBe(false);
  });

  it('suit la formule des jeux', () => {
    // PV au maximum, taux 255, sans bonus : a = 255 × 1/3 = 85
    expect(valeurCapture(255, 100, 100, 1)).toBe(85);
    // 1 PV sur 100, taux 45, bonus 1,5 : a ≈ 67
    expect(valeurCapture(45, 1, 100)).toBe(67);
  });

  it('est plus facile avec peu de PV et un taux élevé', () => {
    expect(chanceCapture(45, 1, 100)).toBeGreaterThan(chanceCapture(45, 29, 100));
    expect(chanceCapture(255, 29, 100)).toBeGreaterThan(chanceCapture(45, 29, 100));
    expect(chanceCapture(255, 1, 100)).toBe(1);
    expect(chanceCapture(3, 29, 100)).toBeLessThan(0.05);
  });

  it('montre 3 secousses avant une capture, moins avant une fuite', () => {
    expect(lancer(45, 10, 100, () => 0)).toEqual({ secousses: 3, capture: true });
    expect(lancer(45, 10, 100, () => 0.999)).toEqual({ secousses: 0, capture: false });
    const suite = [0, 0, 0.999];
    expect(lancer(45, 10, 100, () => suite.shift() ?? 0.999)).toEqual({ secousses: 2, capture: false });
  });
});
