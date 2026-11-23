import { signatureOf } from './motion';
import { Pokemon } from './pokemon';

const make = (over: Partial<Pokemon>): Pokemon => ({ id: 1, name: 'Test', types: [1], gen: 1, stats: [50, 50, 50, 50, 50, 60], height: 1, weight: 30, shape: 8, rank: 0, from: 0, chain: 1, level: 0, moves: [33], ...over });

describe('signature de mouvement', () => {
  it('fait flotter les spectres, quel que soit le reste', () => {
    expect(signatureOf(make({ types: [8, 4], weight: 0.1 })).gesture).toBe('flotte');
  });
  it('fait planer ce qui vole', () => {
    expect(signatureOf(make({ types: [10, 3] })).gesture).toBe('plane');
  });
  it('ancre au sol les très lourds', () => {
    expect(signatureOf(make({ weight: 460, stats: [160, 110, 65, 65, 110, 30] })).gesture).toBe('respire');
  });
  it('rend vifs les très rapides et fait sautiller les légers', () => {
    expect(signatureOf(make({ stats: [35, 55, 40, 50, 50, 120] })).gesture).toBe('vif');
    expect(signatureOf(make({ weight: 6 })).gesture).toBe('bondit');
  });
  it('donne un cycle plus long aux lourds et lents, toujours entre 1,4 et 7 s', () => {
    const light = signatureOf(make({ weight: 2, stats: [1, 1, 1, 1, 1, 150] })).period;
    const heavy = signatureOf(make({ weight: 900, stats: [1, 1, 1, 1, 1, 5] })).period;
    expect(heavy).toBeGreaterThan(light);
    expect(light).toBeGreaterThanOrEqual(1.4);
    expect(heavy).toBeLessThanOrEqual(7);
  });
});
