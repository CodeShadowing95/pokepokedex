import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DuelExpress } from '../../ui/duel-express';

/** Page de démonstration du Duel express, avant de décider s'il remplace la bande des forces. */
@Component({
  selector: 'app-duel-express-page',
  imports: [DuelExpress],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page" style="padding-block: 48px 24px">
      <p class="eyebrow">Démo · les types en un coup de tampon</p>
      <h1 style="margin: 6px 0 12px; font-size: clamp(44px, 7vw, 76px)">Duel express</h1>
      <p style="max-width: 640px; font-size: 18px">
        Choisis un type qui attaque et un Pokémon qui encaisse, avec un ou deux types. Le tampon te dit combien de dégâts
        l’attaque inflige. En mode quiz, c’est à toi de deviner.
      </p>
    </section>
    <section class="page"><app-duel-express /></section>
  `,
})
export class DuelExpressPage {}
