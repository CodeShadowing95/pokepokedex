import { Directive, HostListener, inject, input } from '@angular/core';
import { AudioService } from '../core/audio.service';

/**
 * Le petit bruit d'un bouton : `son="selection"` quand on choisit une option sans s'engager,
 * `son="confirmation"` quand on valide une décision. Rien ne sonne si le son est coupé.
 */
@Directive({ selector: '[son]' })
export class Son {
  private readonly audio = inject(AudioService);
  readonly son = input.required<'selection' | 'confirmation'>();

  @HostListener('click')
  protected jouer(): void {
    this.audio.effet(this.son());
  }
}
