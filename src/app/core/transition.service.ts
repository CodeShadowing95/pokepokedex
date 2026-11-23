import { Injectable, signal } from '@angular/core';

/**
 * L'effet plein écran quand on accepte un combat sauvage, comme dans les jeux :
 * la page tremble sous des éclairs, des bandes d'encre ferment l'écran, une Pokéball tourne,
 * puis les bandes s'ouvrent sur le duel.
 */
export type EtapeTransition = 'couvre' | 'couvert' | 'decouvre';

/** Durées en millisecondes, alignées sur transition-combat.ts. */
export const DUREES = { couvrir: 1100, decouvrir: 650 } as const;

@Injectable({ providedIn: 'root' })
export class TransitionService {
  readonly etape = signal<EtapeTransition | null>(null);

  private get calme(): boolean {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Ferme l'écran ; la promesse se résout quand il est entièrement couvert. */
  couvrir(): Promise<void> {
    if (this.calme) return Promise.resolve();
    this.etape.set('couvre');
    document.querySelector('main')?.animate(
      [{ transform: 'none' }, { transform: 'translate(-8px, 3px)' }, { transform: 'translate(7px, -3px)' }, { transform: 'translate(-5px, 2px)' }, { transform: 'translate(3px, 0)' }, { transform: 'none' }],
      { duration: 450, easing: 'ease-out' },
    );
    return new Promise((fin) => setTimeout(() => { this.etape.set('couvert'); fin(); }, DUREES.couvrir));
  }

  /** Rouvre l'écran sur la nouvelle page. */
  decouvrir(): void {
    if (this.etape() !== 'couvert') return;
    this.etape.set('decouvre');
    setTimeout(() => this.etape() === 'decouvre' && this.etape.set(null), DUREES.decouvrir);
  }
}
