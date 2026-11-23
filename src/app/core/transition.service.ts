import { Injectable, signal } from '@angular/core';

/**
 * Les effets plein écran des rencontres, comme dans les jeux :
 * - « alerte » : deux éclairs blancs et la page qui tremble quand un Pokémon surgit ;
 * - « couvrir » puis « decouvrir » : des bandes d'encre ferment l'écran, une Pokéball tourne,
 *   puis les bandes s'ouvrent sur le duel.
 */
export type EtapeTransition = 'alerte' | 'couvre' | 'couvert' | 'decouvre';

/** Durées en millisecondes, alignées sur transition-combat.ts. */
export const DUREES = { alerte: 650, couvrir: 1100, decouvrir: 650 } as const;

@Injectable({ providedIn: 'root' })
export class TransitionService {
  readonly etape = signal<EtapeTransition | null>(null);

  private get calme(): boolean {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  alerte(): void {
    if (this.calme) return;
    this.etape.set('alerte');
    document.querySelector('main')?.animate(
      [{ transform: 'none' }, { transform: 'translate(-8px, 3px)' }, { transform: 'translate(7px, -3px)' }, { transform: 'translate(-5px, 2px)' }, { transform: 'translate(3px, 0)' }, { transform: 'none' }],
      { duration: 450, easing: 'ease-out' },
    );
    setTimeout(() => this.etape() === 'alerte' && this.etape.set(null), DUREES.alerte);
  }

  /** Ferme l'écran ; la promesse se résout quand il est entièrement couvert. */
  couvrir(): Promise<void> {
    if (this.calme) return Promise.resolve();
    this.etape.set('couvre');
    return new Promise((fin) => setTimeout(() => { this.etape.set('couvert'); fin(); }, DUREES.couvrir));
  }

  /** Rouvre l'écran sur la nouvelle page. */
  decouvrir(): void {
    if (this.etape() !== 'couvert') return;
    this.etape.set('decouvre');
    setTimeout(() => this.etape() === 'decouvre' && this.etape.set(null), DUREES.decouvrir);
  }
}
