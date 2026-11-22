import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PlayerStore } from './core/player.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly player = inject(PlayerStore);
  protected readonly links = [
    { path: '/pokedex', label: 'Pokédex' },
    { path: '/arene', label: 'Arène' },
    { path: '/campagne', label: 'Campagne' },
    { path: '/cartes', label: 'Mes cartes' },
    { path: '/equipe', label: 'Équipe' },
  ];
}
