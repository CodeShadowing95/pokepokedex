import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { PlayerStore } from '../../core/player.store';
import { PokedexService } from '../../core/pokedex.service';
import { normalize } from '../../core/pokemon';
import { REGIONS, TYPES } from '../../core/types';
import { PokeCard } from '../../ui/poke-card';

type Collection = 'tous' | 'captures' | 'vus' | 'inconnus';
type Sort = 'numero' | 'nom' | 'puissance';
const PAGE = 48;

@Component({
  selector: 'app-pokedex',
  imports: [PokeCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pokedex.html',
  styleUrl: './pokedex.css',
})
export class PokedexPage {
  private readonly dex = inject(PokedexService);
  protected readonly player = inject(PlayerStore);

  /** `?type=10` dans l'adresse arrive ici grâce à withComponentInputBinding. */
  readonly type = input<string>();

  protected readonly types = TYPES;
  protected readonly regions = REGIONS;
  protected readonly collections: { key: Collection; label: string }[] = [
    { key: 'tous', label: 'Tous' },
    { key: 'captures', label: 'Capturés' },
    { key: 'vus', label: 'Vus' },
    { key: 'inconnus', label: 'Jamais rencontrés' },
  ];

  protected readonly query = signal('');
  protected readonly activeType = signal(0);
  protected readonly region = signal(0);
  protected readonly collection = signal<Collection>('tous');
  protected readonly sort = signal<Sort>('numero');
  protected readonly limit = signal(PAGE);
  protected readonly ready = this.dex.ready;

  /** La liste filtrée se recalcule seule dès qu'un des signaux lus ici change. */
  protected readonly results = computed(() => {
    const q = normalize(this.query().trim());
    const type = this.activeType(), gen = this.region(), col = this.collection();
    const owned = this.player.owned();
    const seen = new Set(this.player.snapshot().seen);
    const list = this.dex.all().filter((p) => {
      if (type && !p.types.includes(type)) return false;
      if (gen && p.gen !== gen) return false;
      if (col === 'captures' && !owned[p.id]) return false;
      if (col === 'vus' && !(seen.has(p.id) || owned[p.id])) return false;
      if (col === 'inconnus' && (seen.has(p.id) || owned[p.id])) return false;
      if (!q) return true;
      return normalize(p.name).includes(q) || String(p.id) === q.replace('#', '');
    });
    const sort = this.sort();
    if (sort === 'nom') return [...list].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    if (sort === 'puissance') return [...list].sort((a, b) => sum(b.stats) - sum(a.stats));
    return list;
  });
  protected readonly visible = computed(() => this.results().slice(0, this.limit()));
  protected readonly hasMore = computed(() => this.limit() < this.results().length);

  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');

  constructor() {
    effect(() => this.activeType.set(Number(this.type()) || 0));
    // Tout changement de filtre revient à la première « page ».
    effect(() => {
      this.query(); this.activeType(); this.region(); this.collection(); this.sort();
      this.limit.set(PAGE);
    });
    // Défilement infini : quand le repère du bas entre dans l'écran, on affiche 48 cartes de plus.
    afterNextRender(() => {
      const el = this.sentinel()?.nativeElement;
      if (!el) return;
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) this.limit.update((n) => n + PAGE);
      }, { rootMargin: '600px' });
      observer.observe(el);
    });
  }

  protected toggleType(id: number): void {
    this.activeType.update((current) => (current === id ? 0 : id));
  }
  protected clear(): void {
    this.query.set(''); this.activeType.set(0); this.region.set(0); this.collection.set('tous');
  }
  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
  protected asSort(v: string): Sort { return v as Sort; }
}

const sum = (n: number[]) => n.reduce((a, b) => a + b, 0);
