import { TurnReport } from './duel';
import { sequence } from './sequence';

const base: TurnReport = { player: 'frappe', machine: 'frappe', toPlayer: 0, toMachine: 0, playerEffect: 1, machineEffect: 1, first: null, koPlayer: false, koMachine: false, scorer: null, message: '' };

describe('Mise en scène d’un tour', () => {
  it('deux Gardes : aucun coup', () => {
    const s = sequence({ ...base, player: 'garde', machine: 'garde' });
    expect(s.coups).toEqual([]);
    expect(s.note).toContain('Gardes');
  });
  it('échange : le plus rapide frappe en premier, puis l’autre riposte', () => {
    const s = sequence({ ...base, first: 'machine', toPlayer: 12, toMachine: 9 });
    expect(s.coups.map((c) => c.attaquant)).toEqual(['machine', 'player']);
    expect(s.coups[0].tampon).toBe('PLUS RAPIDE !');
  });
  it('pas de riposte si le premier met K.O.', () => {
    const s = sequence({ ...base, first: 'player', toMachine: 40, toPlayer: 0 });
    expect(s.coups.length).toBe(1);
  });
  it('la Garde pare la technique adverse', () => {
    const s = sequence({ ...base, player: 'garde', machine: 'tech', machineEffect: 2 });
    expect(s.gagnant).toBe('player');
    expect(s.coups[0]).toMatchObject({ attaquant: 'machine', degats: 0, tampon: 'PARÉ !' });
  });
  it('la Frappe perce la Garde', () => {
    const s = sequence({ ...base, player: 'garde', machine: 'frappe', toPlayer: 15 });
    expect(s.gagnant).toBe('machine');
    expect(s.coups[0]).toMatchObject({ attaquant: 'machine', tampon: 'GARDE PERCÉE !', degats: 15 });
  });
  it('la technique super efficace est tamponnée', () => {
    const s = sequence({ ...base, player: 'tech', machine: 'frappe', toMachine: 30, playerEffect: 2 });
    expect(s.coups[0].tampon).toBe('SUPER EFFICACE !');
  });
});
