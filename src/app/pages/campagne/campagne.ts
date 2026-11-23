import { Son } from '../../ui/son';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GYMS, LEAGUE } from '../../core/game/campaign';
import { PlayerStore } from '../../core/player.store';
import { REGIONS, typeOf } from '../../core/types';

@Component({
  selector: 'app-campagne',
  imports: [Son, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campagne.html',
  styleUrl: './campagne.css',
})
export class Campagne {
  protected readonly player = inject(PlayerStore);
  protected readonly league = LEAGUE;

  /** Une région s'ouvre quand la Ligue de la précédente est gagnée. */
  protected readonly regions = computed(() => {
    const badges = this.player.snapshot().badges;
    return REGIONS.map((name, i) => ({ id: i + 1, name, won: badges[i + 1] ?? 0, open: i === 0 || (badges[i] ?? 0) >= LEAGUE }));
  });
  private readonly picked = signal(0);
  protected readonly current = computed(() => {
    const regions = this.regions();
    return regions.find((r) => r.id === this.picked() && r.open) ?? [...regions].reverse().find((r) => r.open)!;
  });
  protected readonly steps = computed(() => {
    const r = this.current();
    const gyms = GYMS[r.id - 1].map((g, i) => ({ n: i + 1, title: g.leader, sub: 'Badge ' + g.badge, type: typeOf(g.type) as ReturnType<typeof typeOf> | null }));
    return [...gyms, { n: LEAGUE, title: 'Ligue', sub: 'Les trois plus forts', type: null }].map((s) => ({
      ...s,
      state: s.n <= r.won ? 'gagne' : s.n === r.won + 1 ? 'ouvert' : 'ferme',
    }));
  });

  protected pick(id: number): void { this.picked.set(id); }
}
