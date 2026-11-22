import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlayerStore, dailyNumber, dayKey } from '../../core/player.store';
import { PokedexService } from '../../core/pokedex.service';
import { artwork } from '../../core/pokemon';
import { typeOf } from '../../core/types';
import { PokeCard } from '../../ui/poke-card';
import { TypeForces } from '../../ui/type-forces';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PokeCard, TypeForces],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly dex = inject(PokedexService);
  protected readonly player = inject(PlayerStore);

  /** Les vedettes de la scène d'accueil : Pikachu, Dracaufeu, Tortank, Ectoplasma. */
  protected readonly stage = [
    { id: 25, name: 'Pikachu', line: 'Vif comme l’éclair' },
    { id: 6, name: 'Dracaufeu', line: 'Il plane avant de frapper' },
    { id: 9, name: 'Tortank', line: 'Lourd, ancré, imperturbable' },
    { id: 94, name: 'Ectoplasma', line: 'Il flotte et s’efface' },
  ].map((s, i) => ({ ...s, art: artwork(s.id), delay: i * 4 }));

  protected readonly dailyType = typeOf(this.player.questType);
  protected readonly mysteryArt = computed(() => {
    const all = this.dex.all();
    return all.length ? artwork(all[dailyNumber(dayKey(), 'mystery', all.length)].id) : '';
  });
  /** Six Pokémon du type du jour, différents chaque jour. */
  protected readonly picks = computed(() => {
    const pool = this.dex.all().filter((p) => p.types.includes(this.player.questType));
    if (!pool.length) return [];
    const start = dailyNumber(dayKey(), 'picks', pool.length);
    return Array.from({ length: Math.min(6, pool.length) }, (_, i) => pool[(start + i * 7) % pool.length]).filter((p, i, a) => a.indexOf(p) === i);
  });
  protected readonly fan = [1, 4, 7].map((id) => artwork(id));
}
