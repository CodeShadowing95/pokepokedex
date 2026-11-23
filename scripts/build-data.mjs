// Construit les données statiques du site à partir des fichiers CSV officiels de PokéAPI.
// Usage : npm run data            (télécharge depuis GitHub)
//         CSV_DIR=./csv npm run data   (réutilise des CSV déjà téléchargés)
// Sorties : public/data/pokedex.json (léger, chargé au démarrage)
//           public/data/details.json (textes, chargé à l'ouverture d'une fiche)
//           src/app/core/game/capacites.ts (les capacités de combat, générées)
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SOURCE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';
const CSV_DIR = process.env.CSV_DIR;
const FR = '5';
const EN = '9';
const MAX_ID = 1025;

/** Lit un CSV (guillemets et retours à la ligne dans les champs compris) en tableau d'objets. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

async function load(name) {
  if (CSV_DIR) return parseCsv(await readFile(join(CSV_DIR, `${name}.csv`), 'utf8'));
  const res = await fetch(`${SOURCE}/${name}.csv`);
  if (!res.ok) throw new Error(`${name}.csv : HTTP ${res.status}`);
  return parseCsv(await res.text());
}

const clean = (s) => s.replace(/[\n\f\r]+/g, ' ').replace(/­/g, '').replace(/\s+/g, ' ').trim();

const [pokemon, species, names, pTypes, pStats, flavors, pAbilities, abilityNames, evolutions, moves, moveNames, pMoves] = await Promise.all(
  ['pokemon', 'pokemon_species', 'pokemon_species_names', 'pokemon_types', 'pokemon_stats', 'pokemon_species_flavor_text', 'pokemon_abilities', 'ability_names', 'pokemon_evolution', 'moves', 'move_names', 'pokemon_moves'].map(load),
);

const byId = (rows, key) => {
  const map = new Map();
  for (const r of rows) { if (!map.has(r[key])) map.set(r[key], []); map.get(r[key]).push(r); }
  return map;
};
const namesBySpecies = byId(names, 'pokemon_species_id');
const typesByPokemon = byId(pTypes, 'pokemon_id');
const statsByPokemon = byId(pStats, 'pokemon_id');
const flavorsBySpecies = byId(flavors.filter((f) => f.language_id === FR || f.language_id === EN), 'species_id');
const abilitiesByPokemon = byId(pAbilities, 'pokemon_id');
const abilityFr = new Map(abilityNames.filter((a) => a.local_language_id === FR).map((a) => [a.ability_id, a.name]));
const evolutionBySpecies = new Map(evolutions.map((e) => [e.evolved_species_id, e]));
const pokemonById = new Map(pokemon.map((p) => [p.id, p]));

// --- Capacités de combat -------------------------------------------------------------
// Seules les capacités qui infligent des dégâts directs sont gardées : le duel ne gère ni
// les statuts, ni les attaques en deux tours, ni celles qui imposent une recharge ou un K.O.
const ECARTEES = new Set([
  'explosion', 'self-destruct', 'misty-explosion', 'hyper-beam', 'giga-impact', 'blast-burn', 'hydro-cannon',
  'frenzy-plant', 'rock-wrecker', 'roar-of-time', 'prismatic-laser', 'eternabeam', 'meteor-assault',
  'solar-beam', 'solar-blade', 'fly', 'dig', 'dive', 'bounce', 'skull-bash', 'sky-attack', 'razor-wind',
  'shadow-force', 'phantom-force', 'freeze-shock', 'ice-burn', 'meteor-beam', 'sky-drop', 'electro-shot',
  'focus-punch', 'dream-eater', 'snore', 'last-resort', 'belch', 'fake-out', 'first-impression',
  'future-sight', 'doom-desire', 'synchronoise', 'struggle', 'steel-beam', 'mind-blown', 'chloroblast',
]);
const moveFr = new Map(moveNames.filter((n) => n.local_language_id === FR).map((n) => [n.move_id, n.name]));
const attaques = new Map(
  moves
    .filter((m) => m.power && (m.damage_class_id === '2' || m.damage_class_id === '3') && !ECARTEES.has(m.identifier) && Number(m.id) < 10000)
    .map((m) => [m.id, m]),
);
// Jeux les plus récents d'abord ; Légendes Arceus et Z-A ont leurs propres règles, on les laisse de côté.
const JEUX = [25, 20, 23, 18, 17, 16, 15, 14, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(String);
const parNiveau = new Map();
for (const r of pMoves) {
  if (r.pokemon_move_method_id !== '1' || !attaques.has(r.move_id)) continue;
  const parJeu = parNiveau.get(r.pokemon_id) ?? new Map();
  parNiveau.set(r.pokemon_id, parJeu);
  if (!parJeu.has(r.version_group_id)) parJeu.set(r.version_group_id, []);
  parJeu.get(r.version_group_id).push({ id: r.move_id, level: Number(r.level) });
}
/**
 * Les capacités offensives qu'un Pokémon apprend en montant de niveau, dans le jeu le plus récent
 * qui le connaît : liste aplatie [niveau, capacité, niveau, capacité…], triée par niveau.
 * Le niveau 0 des jeux (« à l'évolution ») compte comme le niveau 1.
 */
function apprentissage(pokemonId) {
  const parJeu = parNiveau.get(pokemonId);
  const jeu = parJeu && JEUX.find((j) => parJeu.has(j));
  if (!jeu) return [1, 33];
  const premier = new Map();
  for (const m of parJeu.get(jeu)) {
    const n = Math.max(1, m.level);
    if (!premier.has(m.id) || premier.get(m.id) > n) premier.set(m.id, n);
  }
  return [...premier].sort((a, b) => a[1] - b[1] || Number(a[0]) - Number(b[0])).flatMap(([id, n]) => [n, Number(id)]);
}

const list = [];
const details = {};
for (const sp of species) {
  const id = Number(sp.id);
  if (id > MAX_ID) continue;
  const p = pokemonById.get(sp.id);
  const local = namesBySpecies.get(sp.id) ?? [];
  const fr = local.find((n) => n.local_language_id === FR) ?? local.find((n) => n.local_language_id === EN);
  const texts = flavorsBySpecies.get(sp.id) ?? [];
  const pick = (lang) => texts.filter((t) => t.language_id === lang).sort((a, b) => Number(b.version_id) - Number(a.version_id))[0];
  const flavor = pick(FR) ?? pick(EN);
  const evo = evolutionBySpecies.get(sp.id);
  list.push({
    id,
    name: fr?.name ?? sp.identifier,
    types: (typesByPokemon.get(sp.id) ?? []).sort((a, b) => a.slot - b.slot).map((t) => Number(t.type_id)),
    gen: Number(sp.generation_id),
    stats: (statsByPokemon.get(sp.id) ?? []).sort((a, b) => a.stat_id - b.stat_id).slice(0, 6).map((s) => Number(s.base_stat)),
    height: Number(p.height) / 10,
    weight: Number(p.weight) / 10,
    shape: Number(sp.shape_id) || 0,
    rank: sp.is_mythical === '1' ? 2 : sp.is_legendary === '1' ? 1 : 0,
    from: sp.evolves_from_species_id ? Number(sp.evolves_from_species_id) : 0,
    chain: Number(sp.evolution_chain_id),
    level: evo?.minimum_level ? Number(evo.minimum_level) : 0,
    learn: apprentissage(sp.id),
    xp: Number(p.base_experience) || 60,
    growth: Number(sp.growth_rate_id) || 2,
  });
  details[id] = {
    genus: fr?.genus ?? '',
    text: flavor ? clean(flavor.flavor_text) : '',
    abilities: (abilitiesByPokemon.get(sp.id) ?? []).sort((a, b) => a.slot - b.slot).map((a) => ({ name: abilityFr.get(a.ability_id) ?? '', hidden: a.is_hidden === '1' })),
    capture: Number(sp.capture_rate),
  };
}
list.sort((a, b) => a.id - b.id);

await mkdir('public/data', { recursive: true });
await writeFile('public/data/pokedex.json', JSON.stringify(list));
await writeFile('public/data/details.json', JSON.stringify(details));

const utilisees = [...new Set(list.flatMap((p) => p.learn.filter((_, i) => i % 2 === 1)))].sort((a, b) => a - b);
const ligne = (id) => {
  const m = attaques.get(String(id));
  const nom = moveFr.get(String(id)) ?? m.identifier;
  return `  ${id}: { nom: ${JSON.stringify(nom)}, type: ${m.type_id}, puissance: ${m.power}, precision: ${m.accuracy || 'null'}, pp: ${m.pp}, classe: '${m.damage_class_id === '2' ? 'physique' : 'speciale'}', priorite: ${m.priority} },`;
};
await writeFile('src/app/core/game/capacites.ts', `// Généré par scripts/build-data.mjs à partir des CSV de PokéAPI. Ne pas modifier à la main.
export interface Capacite {
  nom: string;
  /** Identifiant de type PokéAPI. */
  type: number;
  puissance: number;
  /** En pourcentage ; null = ne rate jamais. */
  precision: number | null;
  pp: number;
  classe: 'physique' | 'speciale';
  priorite: number;
}

export const CAPACITES: Record<number, Capacite> = {
${utilisees.map(ligne).join('\n')}
};
`);
console.log(`${list.length} Pokémon écrits dans public/data/, ${utilisees.length} capacités dans capacites.ts`);
