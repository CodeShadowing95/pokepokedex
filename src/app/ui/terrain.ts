import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TerrainCle, dessin } from '../core/game/terrains';

/** Le décor du duel, posé derrière les Pokémon. Le dessin vient de nos propres données, jamais de l'utilisateur. */
@Component({
  selector: 'app-terrain',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true" [innerHTML]="svg()"></svg>`,
  styles: `
    :host { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
    svg { display: block; width: 100%; height: 100%; }
  `,
})
export class TerrainDuel {
  private readonly sanitizer = inject(DomSanitizer);
  readonly cle = input.required<TerrainCle>();
  readonly nuit = input(false);
  protected readonly svg = computed(() => this.sanitizer.bypassSecurityTrustHtml(dessin(this.cle(), this.nuit())));
}
