import { cri, detail, facteurFr, tirage } from './duel-express';
import { effectiveness } from './types';

describe('Duel express', () => {
  it('Eau contre Feu et Roche fait ×4', () => {
    expect(effectiveness(11, [10, 6])).toBe(4);
    expect(cri(4)).toBe('Ultra efficace !');
  });
  it('détaille chaque type du défenseur', () => {
    expect(detail(11, [10, 3]).map((d) => d.f)).toEqual([2, 1]);
  });
  it('écrit les facteurs à la française', () => {
    expect(facteurFr(0.25)).toBe('0,25');
    expect(cri(0)).toBe('Aucun effet !');
  });
  it('ne tire jamais deux fois le même type pour le défenseur', () => {
    let i = 0;
    const seq = [0, 0.1, 0.1, 0.9];
    const t = tirage(() => seq[i++ % seq.length]);
    expect(t.defense.length).toBe(2);
    expect(t.defense[0]).not.toBe(t.defense[1]);
  });
});
