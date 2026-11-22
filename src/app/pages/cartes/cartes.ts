import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { cardOf, evolutionLevel } from '../../core/game/cards';
import { CARD_XP_PER_LEVEL, PlayerStore, rarityOf } from '../../core/player.store';
import { PokedexService } from '../../core/pokedex.service';
import { Pokemon, artwork } from '../../core/pokemon';
import { typeOf } from '../../core/types';

@Component({
  selector: 'app-cartes',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cartes.html',
  styleUrl: './cartes.css',
})
export class Cartes {
  private readonly dex = inject(PokedexService);
  protected readonly player = inject(PlayerStore);

  /** Évolution en cours d'animation : { de, vers }. */
  protected readonly evolving = signal<{ from: Pokemon; to: Pokemon; done: boolean } | null>(null);

  protected readonly cards = computed(() => {
    const owned = this.player.owned();
    const deck = this.player.deck();
    return Object.entries(owned)
      .flatMap(([key, o]) => {
        const p = this.dex.get(+key);
        if (!p) return [];
        const next = this.dex.evolutions(p.id).map((to) => ({ to, need: evolutionLevel(to), ready: o.level >= evolutionLevel(to) }));
        return [{ p, o, next, card: cardOf(p, o.level), ink: typeOf(p.types[0]), art: artwork(p.id, o.shiny), rarity: rarityOf(p), xpPct: (o.xp / CARD_XP_PER_LEVEL) * 100, inDeck: deck.includes(p.id) }];
      })
      .sort((a, b) => Number(b.inDeck) - Number(a.inDeck) || b.o.level - a.o.level || a.p.id - b.p.id);
  });

  protected art(p: Pokemon): string { return artwork(p.id); }

  protected evolve(from: Pokemon, to: Pokemon): void {
    this.evolving.set({ from, to, done: false });
    // L'éclair blanc dure 1,4 s : on échange la carte au milieu, quand tout est blanc.
    setTimeout(() => {
      this.player.evolve(from.id, to.id);
      this.evolving.update((e) => e && { ...e, done: true });
    }, 1400);
  }
}
