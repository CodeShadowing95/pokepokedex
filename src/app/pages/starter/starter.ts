import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AVATARS, prenomValide } from '../../core/avatars';
import { DRESSEURS, dresseurImg } from '../../core/dresseurs';
import { STARTERS, companions } from '../../core/game/campaign';
import { Card, cardOf } from '../../core/game/cards';
import { signatureOf } from '../../core/motion';
import { PlayerStore } from '../../core/player.store';
import { PokedexService } from '../../core/pokedex.service';
import { artwork } from '../../core/pokemon';
import { REGIONS, typeOf } from '../../core/types';

type Etape = 'avatar' | 'nom' | 'pokemon';

@Component({
  selector: 'app-starter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './starter.html',
  styleUrl: './starter.css',
})
export class Starter {
  private readonly dex = inject(PokedexService);
  private readonly player = inject(PlayerStore);
  private readonly router = inject(Router);

  /** ?modifier=1 depuis le QG : on change seulement d'avatar et de prénom. */
  readonly modifier = input<string>();

  protected readonly etape = signal<Etape>(this.player.dresseur() ? 'pokemon' : 'avatar');
  protected readonly avatar = signal<string>(this.player.dresseur()?.avatar ?? '');
  protected readonly prenom = signal(this.player.dresseur()?.nom ?? '');
  protected readonly prenomOk = computed(() => prenomValide(this.prenom()));
  protected readonly avatars = AVATARS.map((cle) => ({ cle, nom: DRESSEURS[cle].nom, img: dresseurImg(cle) }));
  protected readonly img = dresseurImg;
  protected readonly nouveau = this.player.nouveau;

  constructor() {
    queueMicrotask(() => { if (this.modifier()) this.etape.set('avatar'); });
  }

  protected suite(): void {
    if (this.etape() === 'avatar' && this.avatar()) this.etape.set('nom');
  }

  protected valider(event?: Event): void {
    event?.preventDefault();
    if (!this.prenomOk() || !this.avatar()) return;
    this.player.setDresseur(this.prenom(), this.avatar());
    if (this.player.starter()) this.router.navigateByUrl(this.modifier() ? '/qg' : '/');
    else this.etape.set('pokemon');
  }

  protected explorer(): void {
    this.player.passerAccueil();
    this.router.navigateByUrl('/pokedex');
  }

  protected readonly regions = REGIONS;
  protected readonly region = signal(1);
  protected readonly chosen = signal(0);

  protected noms(card: Card): string {
    return card.moves.map((m) => m.nom).join(', ');
  }
  protected readonly already = this.player.starter;

  protected readonly options = computed(() =>
    STARTERS[this.region() - 1].flatMap((id) => {
      const p = this.dex.get(id);
      if (!p) return [];
      const sig = signatureOf(p);
      return [{ p, art: artwork(id), ink: typeOf(p.types[0]), card: cardOf(p), gesture: 'g-' + sig.gesture, period: sig.period + 's' }];
    }),
  );
  protected readonly friends = computed(() => companions(this.dex.all(), this.region()).map((p) => ({ p, art: artwork(p.id) })));

  protected pickRegion(event: Event): void {
    this.region.set(+(event.target as HTMLSelectElement).value);
    this.chosen.set(0);
  }

  protected confirm(): void {
    const id = this.chosen();
    if (!id) return;
    this.player.chooseStarter(id);
    const friends = this.friends().map((f) => f.p.id);
    friends.forEach((f) => this.player.addCard(f, false));
    this.player.setDeck([id, ...friends]);
    this.router.navigateByUrl('/arene');
  }
}
