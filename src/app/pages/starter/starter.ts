import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { STARTERS, companions } from '../../core/game/campaign';
import { cardOf } from '../../core/game/cards';
import { signatureOf } from '../../core/motion';
import { PlayerStore } from '../../core/player.store';
import { PokedexService } from '../../core/pokedex.service';
import { artwork } from '../../core/pokemon';
import { REGIONS, typeOf } from '../../core/types';

@Component({
  selector: 'app-starter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './starter.html',
  styleUrl: './starter.css',
})
export class Starter {
  private readonly dex = inject(PokedexService);
  private readonly player = inject(PlayerStore);
  private readonly router = inject(Router);

  protected readonly regions = REGIONS;
  protected readonly region = signal(1);
  protected readonly chosen = signal(0);
  protected readonly already = this.player.starter;

  protected readonly options = computed(() =>
    STARTERS[this.region() - 1].flatMap((id) => {
      const p = this.dex.get(id);
      if (!p) return [];
      const sig = signatureOf(p);
      return [{ p, art: artwork(id), ink: typeOf(p.types[0]), card: cardOf(p), gesture: 'g-' + sig.gesture, period: sig.period + 's' }];
    }),
  );
  protected readonly friends = computed(() => companions(this.dex.all(), this.region()).map((p) => ({ p, art: artwork(p.id) })));

  protected pickRegion(event: Event): void {
    this.region.set(+(event.target as HTMLSelectElement).value);
    this.chosen.set(0);
  }

  protected confirm(): void {
    const id = this.chosen();
    if (!id) return;
    this.player.chooseStarter(id);
    const friends = this.friends().map((f) => f.p.id);
    friends.forEach((f) => this.player.addCard(f, false));
    this.player.setDeck([id, ...friends]);
    this.router.navigateByUrl('/arene');
  }
}
