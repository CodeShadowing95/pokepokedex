import { Son } from '../../ui/son';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { cardOf } from '../../core/game/cards';
import { signatureOf } from '../../core/motion';
import { CRAFT_COST, PlayerStore, rarityOf } from '../../core/player.store';
import { PokedexService } from '../../core/pokedex.service';
import { PokemonDetails, animated, artwork, cry, dexNumber } from '../../core/pokemon';
import { REGIONS, STAT_LABELS, TYPES, effectiveness, typeOf } from '../../core/types';
import { TypeChip } from '../../ui/type-chip';

@Component({
  selector: 'app-fiche',
  imports: [Son, RouterLink, TypeChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fiche.html',
  styleUrl: './fiche.css',
})
export class Fiche {
  private readonly dex = inject(PokedexService);
  protected readonly player = inject(PlayerStore);

  /** Le « :id » de la route /pokemon/:id. Une adresse est du texte, d'où le type string. */
  readonly id = input.required<string>();

  protected readonly pokemon = computed(() => this.dex.get(Number(this.id())));
  protected readonly details = signal<PokemonDetails | undefined>(undefined);
  protected readonly shiny = signal(false);
  protected readonly moving = signal(true);
  protected readonly aide = signal(false);
  protected fr(n: number): string {
    return String(n).replace('.', ',');
  }
  protected readonly craftCost = CRAFT_COST;

  protected readonly view = computed(() => {
    const p = this.pokemon();
    if (!p) return undefined;
    const ink = typeOf(p.types[0]);
    const sig = signatureOf(p);
    const sum = p.stats.reduce((a, b) => a + b, 0);
    const matchups = TYPES.map((t) => ({ type: t, factor: effectiveness(t.id, p.types) }));
    return {
      p, ink, sig, sum,
      num: dexNumber(p.id),
      region: REGIONS[p.gen - 1],
      rarity: rarityOf(p),
      stats: p.stats.map((value, i) => ({ label: STAT_LABELS[i], value, pct: Math.min(100, (value / 180) * 100) })),
      weak: matchups.filter((m) => m.factor > 1).sort((a, b) => b.factor - a.factor),
      strong: matchups.filter((m) => m.factor < 1).sort((a, b) => a.factor - b.factor),
      family: this.dex.family(p).map((f) => ({ p: f, art: artwork(f.id), level: f.level })),
      card: cardOf(p, this.player.owned()[p.id]?.level ?? 1),
      sprite: animated(p.id),
      prev: p.id > 1 ? this.dex.get(p.id - 1) : undefined,
      next: this.dex.get(p.id + 1),
    };
  });
  protected readonly art = computed(() => artwork(this.pokemon()?.id ?? 0, this.shiny()));
  protected readonly owned = computed(() => this.player.owned()[this.pokemon()?.id ?? 0]);

  constructor() {
    // À chaque changement de Pokémon : on le note comme « vu » et on va chercher ses textes.
    effect(() => {
      const p = this.pokemon();
      if (!p) return;
      untracked(() => {
        this.player.markSeen(p, this.player.questType);
        this.shiny.set(false);
        this.details.set(undefined);
      });
      this.dex.details(p.id).then((d) => {
        if (this.pokemon()?.id === p.id) this.details.set(d);
      });
    });
  }

  protected playCry(): void {
    const p = this.pokemon();
    if (!p) return;
    const audio = new Audio(cry(p.id));
    audio.volume = 0.35;
    audio.play().catch(() => undefined);
  }

  protected craft(): void {
    const p = this.pokemon();
    if (p) this.player.craft(p.id);
  }

  protected hideBroken(event: Event): void {
    (event.target as HTMLElement).style.display = 'none';
  }
}
