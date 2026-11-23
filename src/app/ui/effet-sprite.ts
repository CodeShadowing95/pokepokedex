import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EFFETS } from '../core/game/effets';

/**
 * Un effet d'attaque en pixel art (planche de JoshR_691), joué image par image.
 * Les effets d'une seule image sont animés par un « pop » : ils grossissent puis s'effacent.
 */
@Component({
  selector: 'app-effet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.une]': 'e().frames === 1',
    '[class.boucle]': 'boucle()',
    '[style.--src]': 'src()',
    '[style.--n]': 'e().frames',
    '[style.width.px]': 'e().w * k()',
    '[style.height.px]': 'e().h * k()',
    '[style.--fin]': "'-' + e().w * k() * e().frames + 'px'",
    '[style.--duree]': 'duree() + "ms"',
  },
  template: '',
  styles: `
    :host {
      display: block; pointer-events: none; image-rendering: pixelated;
      background: var(--src) 0 0 / auto 100% no-repeat;
      animation: jouer var(--duree) steps(var(--n)) forwards;
    }
    :host(.boucle) { animation-iteration-count: infinite; }
    :host(.une) { background-position: center; animation: pop var(--duree) cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    @keyframes jouer { to { background-position: var(--fin) 0; } }
    @keyframes pop { 0% { transform: scale(0.3); opacity: 0; } 35% { transform: scale(1.15); opacity: 1; } 75% { opacity: 1; } 100% { transform: scale(1.3); opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { :host, :host(.une) { animation: none; } }
  `,
})
export class EffetSprite {
  /** Nom de l'effet : un type (feu, eau…), « impact » ou « garde ». */
  readonly nom = input.required<string>();
  /** Taille visée en pixels pour le plus grand côté. */
  readonly taille = input(130);
  readonly boucle = input(false);

  protected readonly e = computed(() => EFFETS[this.nom()] ?? EFFETS['impact']);
  /** Agrandissement entier pour garder les pixels nets. */
  protected readonly k = computed(() => Math.max(2, Math.round(this.taille() / Math.max(this.e().w, this.e().h))));
  protected readonly src = computed(() => `url(effets/${this.nom() in EFFETS ? this.nom() : 'impact'}.png)`);
  protected readonly duree = computed(() => (this.e().frames === 1 ? 700 : Math.min(900, 110 * this.e().frames)));
}
