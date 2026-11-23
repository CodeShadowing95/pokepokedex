/**
 * Les terrains du duel, dessinés à l'encre comme le reste du site.
 * Chaque terrain a une palette de jour et une de nuit ; les socles ovales
 * prennent la couleur du sol de leur terrain (un sol « typique », plus franc que le décor).
 */
export type TerrainCle = 'herbe' | 'grotte' | 'eau' | 'neige' | 'volcan' | 'ville';

export interface Palette {
  ciel: string; loin: string; loin2: string; sol: string; sol2: string; deco: string; deco2: string;
  /** Le socle : sa face, sa tranche et son grain. */
  socle: string; socleHaut: string; grain: string;
}

export interface Terrain { cle: TerrainCle; nom: string; jour: Palette; nuit: Palette }

const p = (ciel: string, loin: string, loin2: string, sol: string, sol2: string, deco: string, deco2: string, socle: string, socleHaut: string, grain: string): Palette =>
  ({ ciel, loin, loin2, sol, sol2, deco, deco2, socle, socleHaut, grain });

export const TERRAINS: Record<TerrainCle, Terrain> = {
  herbe: {
    cle: 'herbe', nom: 'Hautes herbes',
    jour: p('#bfe0ea', '#9cc98a', '#7fb36c', '#b5d67a', '#8fbf5a', '#ffffff', '#ffc93c', '#7cae4c', '#a3cf6a', '#5e8f3a'),
    nuit: p('#2d3b6b', '#3f6259', '#33524c', '#557a4d', '#46683f', '#45558a', '#ffc93c', '#4a6d40', '#62874f', '#36522f'),
  },
  grotte: {
    cle: 'grotte', nom: 'Grotte',
    jour: p('#8f7f6e', '#a8957f', '#7d6c5c', '#c4b294', '#a8957a', '#8fd3e8', '#ffffff', '#9b8667', '#bba886', '#76644b'),
    nuit: p('#3f3747', '#5a4f5d', '#4a4150', '#6d6265', '#5c5256', '#7fd3d0', '#ffffff', '#5d5352', '#776c6a', '#463d3e'),
  },
  eau: {
    cle: 'eau', nom: 'Bord de mer',
    jour: p('#aed9ee', '#5aa0ec', '#3f86d4', '#efd8a2', '#e2c486', '#ffffff', '#f2762e', '#dcbd7c', '#efd59c', '#b8975a'),
    nuit: p('#26375f', '#2f528a', '#264473', '#8f8170', '#7d705f', '#5873a8', '#ffc93c', '#7d6f5d', '#978972', '#5f5444'),
  },
  neige: {
    cle: 'neige', nom: 'Montagne enneigée',
    jour: p('#d6e6f1', '#ffffff', '#c3d6e6', '#f6f9fb', '#dbe7f0', '#4f8a6a', '#7fd3d0', '#d5e3ee', '#f3f8fb', '#a9bfd1'),
    nuit: p('#2b3966', '#c3cfe0', '#8fa1bf', '#a9b8cf', '#94a5c0', '#2f5a4c', '#7fd3d0', '#8b9cb9', '#b2c0d6', '#6b7c9b'),
  },
  volcan: {
    cle: 'volcan', nom: 'Volcan',
    jour: p('#f4cfa6', '#8a5a48', '#6e4538', '#b07a5e', '#94634c', '#f2762e', '#ffc93c', '#7a4f3e', '#9c6a52', '#f2762e'),
    nuit: p('#3b2b4d', '#5a3a3f', '#482e35', '#6a4540', '#573936', '#f2762e', '#ffc93c', '#4b3131', '#634240', '#f2762e'),
  },
  ville: {
    cle: 'ville', nom: 'Arène de ville',
    jour: p('#e8dfcf', '#c9c3b6', '#b3ac9e', '#d9cfbb', '#cbc0aa', '#ffc93c', '#d63a26', '#b9ae98', '#d5cab4', '#8f8572'),
    nuit: p('#2e3662', '#5b5f78', '#4b4f69', '#8d8779', '#7c766a', '#ffc93c', '#d63a26', '#7a7466', '#958f80', '#5f5a4f'),
  },
};

/** Le terrain qui va avec un type : là où l'on croiserait ce Pokémon, ou l'arène de ce type. */
const PAR_TYPE: Record<number, TerrainCle> = {
  1: 'herbe', 3: 'herbe', 4: 'herbe', 7: 'herbe', 12: 'herbe', 18: 'herbe',
  5: 'grotte', 6: 'grotte', 8: 'grotte', 16: 'grotte', 17: 'grotte',
  11: 'eau',
  15: 'neige',
  10: 'volcan',
  2: 'ville', 9: 'ville', 13: 'ville', 14: 'ville',
};

export const terrainPourType = (type: number): TerrainCle => PAR_TYPE[type] ?? 'herbe';

/** La nuit tombe à 20 h et se lève à 7 h, à l'heure de l'appareil. */
export const estNuit = (date = new Date()) => date.getHours() >= 20 || date.getHours() < 7;

const T = 'stroke="#1e2340" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

/** Le décor, à l'échelle 800 × 500, que la scène recadre sans le déformer. */
export function dessin(cle: TerrainCle, nuit: boolean): string {
  const c = TERRAINS[cle][nuit ? 'nuit' : 'jour'];
  const ciel = `<rect width="800" height="500" fill="${c.ciel}"/>`;
  const etoiles = nuit
    ? `<g fill="#ffc93c">${[[90, 110], [210, 150], [250, 100], [470, 135], [560, 95], [760, 160], [40, 180]].map(([x, y]) => `<path d="M${x} ${y - 7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>`).join('')}</g>
       <circle cx="330" cy="125" r="26" fill="#f5f0e6" ${T}/><circle cx="342" cy="117" r="22" fill="${c.ciel}"/>`
    : '';
  const nuage = (x: number, y: number, s = 1) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M0 30 q0-18 20-18 q6-14 24-12 q16-10 30 4 q20-2 22 16 q0 10-12 10 h-74 q-10 0-10-10z" fill="${c.deco}" ${T}/>`;
  const touffe = (x: number, y: number) => `<path d="M${x} ${y}l4-12 3 12 4-15 3 15 4-10 2 10" fill="none" ${T}/>`;

  switch (cle) {
    case 'herbe': return `${ciel}${etoiles}${nuit ? '' : nuage(110, 95) + nuage(520, 110, 0.8)}
      <path d="M0 215 Q110 140 250 190 T520 180 T800 160 V280 H0Z" fill="${c.loin}" ${T}/>
      <path d="M0 240 Q200 200 420 225 T800 210 V290 H0Z" fill="${c.loin2}" ${T}/>
      <g ${T}><rect x="52" y="150" width="14" height="60" fill="#8a5a48"/><circle cx="59" cy="140" r="34" fill="${c.sol2}"/><circle cx="740" cy="150" r="26" fill="${c.sol2}"/><rect x="734" y="172" width="12" height="40" fill="#8a5a48"/></g>
      <path d="M0 255 Q400 232 800 250 V500 H0Z" fill="${c.sol}" ${T}/>
      <path d="M-20 330 Q300 300 820 340 M-20 420 Q420 380 820 430" fill="none" stroke="${c.sol2}" stroke-width="10" opacity="0.55"/>
      ${[[60, 300], [190, 470], [330, 290], [470, 470], [700, 300], [760, 470], [40, 420]].map(([x, y]) => touffe(x, y)).join('')}
      <g ${T}>${[[120, 280, c.deco2], [620, 455, '#d63a26'], [400, 480, c.deco2], [560, 290, '#f5f0e6']].map(([x, y, f]) => `<circle cx="${x}" cy="${y}" r="5" fill="${f}"/>`).join('')}</g>`;

    case 'grotte': return `${ciel}
      <path d="M0 0 H800 V60 L760 40 740 110 715 50 690 70 660 30 620 90 590 40 540 60 500 30 450 80 410 35 360 70 320 30 270 85 230 40 190 70 150 30 110 95 80 45 40 70 0 40Z" fill="${c.loin2}" ${T}/>
      <path d="M0 260 L0 120 Q60 90 120 150 L170 120 220 190 280 170 330 230 V270Z" fill="${c.loin}" ${T}/>
      <path d="M800 250 V110 Q730 80 680 140 L620 120 570 200 520 190 480 240 V260Z" fill="${c.loin}" ${T}/>
      <g ${T} fill="${c.deco}"><path d="M140 250 l12-46 12 46z"/><path d="M160 250 l9-30 9 30z"/><path d="M640 245 l13-52 13 52z"/><path d="M664 245 l8-28 8 28z"/></g>
      <path d="M0 255 Q400 225 800 250 V500 H0Z" fill="${c.sol}" ${T}/>
      <g ${T} fill="${c.sol2}"><ellipse cx="90" cy="440" rx="40" ry="14"/><ellipse cx="380" cy="300" rx="24" ry="8"/><ellipse cx="730" cy="460" rx="34" ry="12"/><circle cx="520" cy="470" r="9"/><circle cx="250" cy="330" r="6"/></g>
      ${nuit ? `<g fill="${c.deco}" opacity="0.9">${[[220, 120], [560, 90], [420, 150]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g>` : ''}`;

    case 'eau': return `${ciel}${etoiles}${nuit ? '' : nuage(80, 100, 0.9) + nuage(400, 90, 0.7) + `<circle cx="690" cy="120" r="30" fill="#ffc93c" ${T}/>`}
      <path d="M0 175 H800 V290 H0Z" fill="${c.loin}" ${T}/>
      <path d="M0 200 Q200 190 400 200 T800 198 V290 H0Z" fill="${c.loin2}"/>
      ${[[60, 195], [250, 215], [470, 190], [640, 225], [150, 245], [560, 255], [720, 200]].map(([x, y]) => `<path d="M${x} ${y} q10-8 20 0 q10 8 20 0" fill="none" stroke="${c.deco}" stroke-width="3" stroke-linecap="round"/>`).join('')}
      <path d="M570 175 l20-40 h70 l14 40z" fill="#c9c3b6" ${T}/><path d="M610 135 v-30 l30 20z" fill="${c.deco2}" ${T}/>
      <path d="M0 268 Q180 245 380 262 T800 255 V500 H0Z" fill="${c.sol}" ${T}/>
      <path d="M0 268 Q180 245 380 262 T800 255" fill="none" stroke="${c.deco}" stroke-width="6" opacity="0.8"/>
      <g ${T}><path d="M90 430 l10-14 10 14 -10 8z" fill="#f0a3d0"/><path d="M700 470 q12-20 24 0z" fill="#f5f0e6"/><circle cx="420" cy="470" r="5" fill="${c.sol2}"/><circle cx="300" cy="320" r="4" fill="${c.sol2}"/></g>`;

    case 'neige': return `${ciel}${etoiles}
      <path d="M0 230 L120 90 190 170 290 60 400 190 500 100 600 180 700 80 800 170 V280 H0Z" fill="${c.loin2}" ${T}/>
      <g fill="${c.loin}" ${T}><path d="M120 90 L150 125 135 120 118 132 100 112Z"/><path d="M290 60 L330 107 310 100 290 115 268 98 255 102Z"/><path d="M500 100 L530 136 512 130 495 142 478 124Z"/><path d="M700 80 L735 120 716 114 700 126 682 110 667 118Z"/></g>
      ${[[40, 250], [90, 240], [690, 245], [750, 250]].map(([x, y]) => `<path d="M${x} ${y} l-20 0 20-60 20 60z" fill="${c.deco}" ${T}/><path d="M${x - 9} ${y - 35} l9-18 9 18z" fill="${c.loin}" ${T}/>`).join('')}
      <path d="M0 258 Q400 232 800 252 V500 H0Z" fill="${c.sol}" ${T}/>
      <g fill="none" stroke="${c.sol2}" stroke-width="5" stroke-linecap="round"><path d="M60 330 q60-14 120 0"/><path d="M520 300 q50-12 100 0"/><path d="M320 450 q80-16 160 0"/><path d="M660 430 q50-10 100 0"/></g>
      <g fill="#ffffff" stroke="#1e2340" stroke-width="1.5">${[[200, 110], [400, 150], [620, 100], [760, 140], [60, 120], [470, 95]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4"/>`).join('')}</g>`;

    case 'volcan': return `${ciel}${etoiles}
      <g fill="${nuit ? '#5b5f78' : '#c9c3b6'}" ${T} opacity="0.9"><circle cx="440" cy="100" r="18"/><circle cx="468" cy="88" r="22"/><circle cx="498" cy="98" r="16"/></g>
      <path d="M220 270 L380 110 H520 L680 270Z" fill="${c.loin}" ${T}/>
      <path d="M380 110 H520 L505 130 485 120 470 145 450 122 430 140 410 118 395 128Z" fill="${c.deco}" ${T}/>
      <path d="M455 135 q-10 40 6 70 q-12 30 4 60" fill="none" stroke="${c.deco}" stroke-width="8" stroke-linecap="round"/>
      <path d="M0 270 L0 180 L90 150 170 210 250 270Z" fill="${c.loin2}" ${T}/><path d="M800 270 V170 L720 150 640 220 600 270Z" fill="${c.loin2}" ${T}/>
      <path d="M0 262 Q400 235 800 258 V500 H0Z" fill="${c.sol}" ${T}/>
      <path d="M-10 380 Q160 345 300 372 T620 360 T820 385" fill="none" stroke="#1e2340" stroke-width="12" stroke-linecap="round"/>
      <path d="M-10 380 Q160 345 300 372 T620 360 T820 385" fill="none" stroke="${c.deco}" stroke-width="6" stroke-linecap="round"/>
      <g ${T} fill="${c.sol2}"><path d="M70 320 l14-18 18 6 6 14z"/><path d="M640 310 l18-20 22 8 6 14z"/><path d="M400 470 l12-14 16 4 6 10z"/></g>`;

    case 'ville': return `${ciel}${etoiles}
      <g ${T}>${[[0, 110, 90], [90, 70, 70], [160, 130, 80], [470, 90, 80], [550, 60, 90], [640, 120, 70], [710, 80, 90]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${230 - y}" fill="${c.loin}"/>`).join('')}</g>
      <g fill="${nuit ? c.deco : '#f5f0e6'}" stroke="#1e2340" stroke-width="1.5">${[[20, 130], [50, 130], [20, 165], [110, 95], [130, 140], [185, 150], [210, 185], [490, 110], [520, 150], [575, 85], [605, 130], [660, 140], [735, 100], [765, 140], [735, 175]].map(([x, y]) => `<rect x="${x}" y="${y}" width="14" height="16"/>`).join('')}</g>
      <path d="M240 230 V150 Q400 90 560 150 V230Z" fill="${c.loin2}" ${T}/>
      <path d="M240 150 Q400 90 560 150" fill="none" stroke="${c.deco2}" stroke-width="8"/>
      <circle cx="400" cy="150" r="20" fill="#fff" ${T}/><path d="M380 150 h40" ${T}/><circle cx="400" cy="150" r="6" fill="#fff" ${T}/>
      <path d="M0 240 H800 V500 H0Z" fill="${c.sol}" ${T}/>
      <g fill="none" stroke="#f5f0e6" stroke-width="5" opacity="0.9"><rect x="70" y="275" width="660" height="200" rx="6"/><path d="M400 275 V475"/><circle cx="400" cy="375" r="46"/></g>
      <path d="M0 240 H800" ${T}/><path d="M0 252 H800" stroke="${c.sol2}" stroke-width="8"/>`;
  }
}
