import { Injectable, computed, signal } from '@angular/core';
import { Pokemon, PokemonDetails } from './pokemon';

/**
 * Source unique des données Pokémon.
 * L'index des 1 025 Pokémon est un fichier statique livré avec le site : aucune API à l'exécution,
 * donc la liste, la recherche et le jeu restent instantanés même hors ligne.
 */
@Injectable({ providedIn: 'root' })
export class PokedexService {
  private readonly list = signal<Pokemon[]>([]);
  private detailsRequest?: Promise<Record<string, PokemonDetails>>;

  readonly all = this.list.asReadonly();
  readonly ready = computed(() => this.list().length > 0);
  private readonly byId = computed(() => new Map(this.list().map((p) => [p.id, p])));

  constructor() {
    fetch('data/pokedex.json')
      .then((r) => r.json())
      .then((data: Pokemon[]) => this.list.set(data))
      .catch((err) => console.error('Index Pokédex introuvable', err));
  }

  get(id: number): Pokemon | undefined {
    return this.byId().get(id);
  }

  /** Textes d'une fiche. Le fichier n'est téléchargé qu'une fois, à la première fiche ouverte. */
  async details(id: number): Promise<PokemonDetails | undefined> {
    this.detailsRequest ??= fetch('data/details.json').then((r) => r.json());
    return (await this.detailsRequest)[id];
  }

  /** Lignée complète, du premier stade au dernier, branches comprises. */
  family(p: Pokemon): Pokemon[] {
    return this.list().filter((o) => o.chain === p.chain);
  }

  /** Évolutions directes d'un Pokémon. */
  evolutions(id: number): Pokemon[] {
    return this.list().filter((o) => o.from === id);
  }
}
