import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AudioService } from './core/audio.service';
import { RencontreService } from './core/rencontre.service';
import { RencontreSauvage } from './ui/rencontre-sauvage';
import { Logotype } from './ui/logotype';
import { ReglageSon } from './ui/reglage-son';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PlayerStore } from './core/player.store';
import { dresseurImg } from './core/dresseurs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logotype, RencontreSauvage, ReglageSon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly player = inject(PlayerStore);
  protected readonly img = dresseurImg;
  protected readonly audio = inject(AudioService);

  constructor() {
    inject(RencontreService).demarrer();
    // Hors de l'arène, c'est la musique d'ouverture ; l'arène choisit elle-même la sienne.
    inject(Router).events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      if (!e.urlAfterRedirects.startsWith('/arene')) this.audio.jouer('opening');
    });
  }
  protected readonly links = [
    { path: '/pokedex', label: 'Pokédex' },
    { path: '/arene', label: 'Arène' },
    { path: '/campagne', label: 'Campagne' },
    { path: '/cartes', label: 'Mes cartes' },
    { path: '/equipe', label: 'Équipe' },
  ];
}
