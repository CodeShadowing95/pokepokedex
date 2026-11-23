/**
 * Les fonds de combat : planche « Battle BG's for GBA » de Gold-Ruki (crédit obligatoire),
 * découpée en 18 fonds de 240 × 112 pixels dans public/terrains/fonds/.
 * Les socles sont dessinés dans chaque fond, à la couleur de leur sol.
 */
export const FONDS = [
  'herbe', 'chemin', 'foret', 'eau', 'nuit', 'neige', 'roche', 'sable', 'lagon',
  'caverne', 'psy', 'braise', 'fee', 'ligue', 'marais', 'volcan', 'spectre', 'desert',
] as const;
export type Fond = (typeof FONDS)[number];

/** Le fond de jour et le fond de nuit de chaque type (même fond : il est simplement assombri). */
const PAR_TYPE: Record<number, readonly [Fond, Fond]> = {
  1: ['chemin', 'nuit'], 2: ['roche', 'caverne'], 3: ['herbe', 'nuit'], 4: ['marais', 'marais'],
  5: ['desert', 'caverne'], 6: ['roche', 'caverne'], 7: ['foret', 'marais'], 8: ['spectre', 'spectre'],
  9: ['caverne', 'caverne'], 10: ['braise', 'volcan'], 11: ['eau', 'nuit'], 12: ['herbe', 'foret'],
  13: ['chemin', 'nuit'], 14: ['psy', 'spectre'], 15: ['neige', 'nuit'], 16: ['volcan', 'volcan'],
  17: ['spectre', 'spectre'], 18: ['fee', 'psy'],
};

export const fondPourType = (type: number, nuit: boolean): Fond => (PAR_TYPE[type] ?? PAR_TYPE[1])[nuit ? 1 : 0];

/** Les fonds déjà sombres ; les autres sont assombris la nuit. */
export const FONDS_SOMBRES: ReadonlySet<Fond> = new Set(['nuit', 'ligue', 'marais', 'spectre', 'volcan', 'foret', 'caverne']);

/** La nuit tombe à 20 h et se lève à 7 h, à l'heure de l'appareil. */
export const estNuit = (date = new Date()) => date.getHours() >= 20 || date.getHours() < 7;

export const fondUrl = (fond: Fond) => `terrains/fonds/${fond}.png`;
