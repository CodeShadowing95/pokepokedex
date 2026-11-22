import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlayerStore } from '../core/player.store';
import { Pokemon, artwork, dexNumber } from '../core/pokemon';
import { typeOf } from '../core/types';
import { TypeChip } from './type-chip';

/** Carte d'un Pokémon dans une grille. Elle sait seule si le joueur l'a capturé, vu, ou jamais croisé. */
@Component({
  selector: 'app-poke-card',
  imports: [RouterLink, TypeChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="pc" [class.unknown]="status() === 'inconnu'" [routerLink]="['/pokemon', pokemon().id]" [style.animation-delay.ms]="delay()">
      <div class="art dots" [style.background-color]="status() === 'inconnu' ? '#EAE2D2' : ink()">
        <img [src]="art()" [alt]="status() === 'inconnu' ? 'Silhouette' : pokemon().name" width="140" height="140" loading="lazy" decoding="async" />
        @if (status() === 'capturé') {
          <span class="tag mono">Capturé</span>
        }
      </div>
      <div class="body">
        <span class="mono num">{{ num() }}</span>
        <strong class="disp name">{{ status() === 'inconnu' ? '???' : pokemon().name }}</strong>
        <span class="types">
          @for (t of pokemon().types; track t) {
            <app-type-chip [type]="t" />
          }
        </span>
      </div>
    </a>
  `,
  styles: `
    :host { display: block; }
    .body { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px 16px; }
    .num { font-size: 12px; color: var(--color-encre-douce); }
    .name { font-size: 21px; }
    .types { display: flex; gap: 6px; flex-wrap: wrap; }
    .tag { position: absolute; top: 10px; right: 10px; padding: 2px 9px; border: 2px solid var(--color-encre); border-radius: 999px; background: #fff; font-size: 11px; font-weight: 700; }
  `,
})
export class PokeCard {
  private readonly player = inject(PlayerStore);
  readonly pokemon = input.required<Pokemon>();
  /** Si vrai, un Pokémon jamais rencontré s'affiche en silhouette. */
  readonly hideUnknown = input(false);
  readonly delay = input(0);

  protected readonly status = computed(() => {
    const id = this.pokemon().id;
    if (this.player.owned()[id]) return 'capturé';
    if (!this.hideUnknown() || this.player.snapshot().seen.includes(id)) return 'vu';
    return 'inconnu';
  });
  protected readonly art = computed(() => artwork(this.pokemon().id));
  protected readonly num = computed(() => dexNumber(this.pokemon().id));
  protected readonly ink = computed(() => typeOf(this.pokemon().types[0]).color);
}
