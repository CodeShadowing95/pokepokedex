// Construit les données statiques du site à partir des fichiers CSV officiels de PokéAPI.
// Usage : npm run data            (télécharge depuis GitHub)
//         CSV_DIR=./csv npm run data   (réutilise des CSV déjà téléchargés)
// Sorties : public/data/pokedex.json (léger, chargé au démarrage)
//           public/data/details.json (textes, chargé à l'ouverture d'une fiche)
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

const [pokemon, species, names, pTypes, pStats, flavors, pAbilities, abilityNames, evolutions] = await Promise.all(
  ['pokemon', 'pokemon_species', 'pokemon_species_names', 'pokemon_types', 'pokemon_stats', 'pokemon_species_flavor_text', 'pokemon_abilities', 'ability_names', 'pokemon_evolution'].map(load),
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
console.log(`${list.length} Pokémon écrits dans public/data/`);
