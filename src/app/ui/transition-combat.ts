import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TransitionService } from '../core/transition.service';

/** Le voile de transition, posé au-dessus de tout le site. */
@Component({
  selector: 'app-transition-combat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (t.etape(); as e) {
      <div class="voile" [attr.data-etape]="e" aria-hidden="true">
        @if (e === 'alerte') {
          <span class="eclair"></span>
        } @else {
          <span class="eclair"></span>
          @for (i of bandes; track i) { <span class="bande" [style.--i]="i"></span> }
          <i class="pokeball geante"></i>
        }
      </div>
    }
  `,
  styles: `
    .voile { position: fixed; inset: 0; z-index: 100; display: grid; grid-template-rows: repeat(8, 1fr); overflow: hidden; pointer-events: none; }
    .voile:not([data-etape='alerte']) { pointer-events: auto; }
    .eclair { position: absolute; inset: 0; z-index: 2; background: #fff; opacity: 0; }

    /* Deux éclairs blancs quand le Pokémon surgit. */
    [data-etape='alerte'] .eclair { animation: eclairs 0.65s steps(1) both; }
    @keyframes eclairs { 0% { opacity: 0.85; } 15% { opacity: 0; } 30% { opacity: 0.85; } 45%, 100% { opacity: 0; } }

    /* Trois éclairs, puis les bandes d'encre ferment l'écran une à une, en alternant les côtés. */
    [data-etape='couvre'] .eclair { animation: eclairs 0.45s steps(1) both; }
    .bande { position: relative; z-index: 1; background: var(--color-encre); border-block: 2px solid var(--color-papier); }
    .bande:nth-child(odd) { --de: -101%; }
    .bande:nth-child(even) { --de: 101%; }
    [data-etape='couvre'] .bande { animation: fermer 0.32s calc(0.45s + var(--i) * 0.045s) cubic-bezier(0.6, 0, 0.9, 0.6) both; }
    [data-etape='couvert'] .bande { transform: none; }
    [data-etape='decouvre'] .bande { animation: fermer 0.4s calc(var(--i) * 0.03s) cubic-bezier(0.2, 0.6, 0.4, 1) reverse both; }
    @keyframes fermer { from { transform: translateX(var(--de)); } to { transform: none; } }

    /* Une Pokéball géante tourne au centre pendant le changement de page. */
    .geante { position: absolute; left: 50%; top: 50%; z-index: 3; font-size: min(34vw, 220px); margin: -0.5em 0 0 -0.5em; border-width: 6px; box-shadow: 0 0 0 6px var(--color-papier); }
    [data-etape='couvre'] .geante { animation: rouler 0.45s 0.85s var(--ease-ressort) both; }
    [data-etape='couvert'] .geante { animation: tourner 0.9s linear infinite; }
    [data-etape='decouvre'] .geante { animation: rouler 0.3s reverse both; }
    @keyframes rouler { from { transform: scale(0) rotate(-540deg); } to { transform: none; } }
    @keyframes tourner { to { transform: rotate(360deg); } }
  `,
})
export class TransitionCombat {
  protected readonly t = inject(TransitionService);
  protected readonly bandes = [0, 1, 2, 3, 4, 5, 6, 7];
}
