import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AudioService } from './audio.service';
import { TransitionService } from './transition.service';
import { total } from './game/cards';
import { PlayerStore } from './player.store';
import { PokedexService } from './pokedex.service';
import { Pokemon } from './pokemon';
import { RENCONTRE, pageOuverte, tirerSauvage } from './rencontre';

export interface Rencontre {
  pokemon: Pokemon;
  chromatique: boolean;
  nouveau: boolean;
  /** 'bulle' : le « ! » seul ; 'carte' : le Pokémon et les deux choix ; 'fuite' : le mot de fin. */
  etape: 'bulle' | 'carte' | 'fuite';
  fin: string;
}

/**
 * Les rencontres sauvages : pendant qu'on parcourt le site, de temps en temps,
 * un Pokémon surgit et propose un combat. Rare exprès, pour garder la surprise.
 * Astuce de démonstration : ajouter ?sauvage=1 à l'adresse en déclenche une tout de suite.
 */
@Injectable({ providedIn: 'root' })
export class RencontreService {
  private readonly router = inject(Router);
  private readonly player = inject(PlayerStore);
  private readonly dex = inject(PokedexService);
  private readonly audio = inject(AudioService);
  private readonly transition = inject(TransitionService);

  readonly courante = signal<Rencontre | null>(null);
  private readonly debut = Date.now();
  private derniere = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];

  demarrer(): void {
    // Service racine : il vit aussi longtemps que la page, l'intervalle aussi.
    setInterval(() => this.tirer(), RENCONTRE.tirage);
    const demande = (url: string) => new URL(url, 'http://x').searchParams.get('sauvage') === '1' && pageOuverte(url);
    if (typeof location !== 'undefined' && demande(location.pathname + location.search)) this.essayer(0);
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      if (demande(e.urlAfterRedirects)) this.essayer(0);
    });
  }

  /** Démonstration : attend que les données soient prêtes, puis fait surgir un Pokémon. */
  private essayer(n: number): void {
    setTimeout(() => {
      if (!this.dex.ready() && n < 20) return this.essayer(n + 1);
      this.surgir(true);
    }, 800);
  }

  private tirer(): void {
    const maintenant = Date.now();
    if (this.courante() || !pageOuverte(this.router.url) || document.visibilityState !== 'visible') return;
    if (maintenant - this.debut < RENCONTRE.premiere || maintenant - this.derniere < RENCONTRE.ecart) return;
    if (this.player.rencontresDuJour() >= RENCONTRE.parJour || Math.random() > RENCONTRE.chance) return;
    this.surgir(false);
  }

  /** Fait surgir un Pokémon. `force` ignore les limites (démonstration). */
  surgir(force: boolean): void {
    if (this.courante() || !this.player.starter() || !this.dex.ready()) return;
    if (!force && this.player.rencontresDuJour() >= RENCONTRE.parJour) return;
    const equipe = this.player.deck().map((id) => this.dex.get(id)).filter((p): p is Pokemon => !!p);
    const puissance = equipe.length ? equipe.reduce((s, p) => s + total(p), 0) / equipe.length : 320;
    const pokemon = tirerSauvage(this.dex.all(), puissance);
    if (!pokemon) return;
    this.derniere = Date.now();
    this.player.noterRencontre();
    this.courante.set({ pokemon, chromatique: Math.random() < RENCONTRE.chromatique, nouveau: !this.player.isSeen(pokemon.id), etape: 'bulle', fin: '' });
    this.audio.effet('exclamation');
    this.plus(900, () => this.courante.update((r) => r && { ...r, etape: 'carte' }));
    this.plus(RENCONTRE.patience, () => this.partir(`${pokemon.name} est reparti dans les hautes herbes.`));
  }

  combattre(): void {
    const r = this.courante();
    if (!r) return;
    this.fermer();
    this.player.markSeen(r.pokemon, 0);
    this.audio.jouer('sauvage');
    // On accepte le combat : la musique part, l'écran clignote, les bandes d'encre ferment l'écran, on change de page dessous, puis elles s'ouvrent sur le duel.
    void this.transition.couvrir()
      .then(() => this.router.navigate(['/arene'], { queryParams: { sauvage: r.pokemon.id, chroma: r.chromatique ? 1 : null } }))
      .finally(() => setTimeout(() => this.transition.decouvrir(), 250));
  }

  fuir(): void {
    this.partir('Tu as pris la fuite.');
  }

  private partir(fin: string): void {
    if (!this.courante()) return;
    this.vider();
    this.courante.update((r) => r && { ...r, etape: 'fuite', fin });
    this.plus(1800, () => this.courante.set(null));
  }

  private fermer(): void {
    this.vider();
    this.courante.set(null);
  }

  private plus(ms: number, f: () => void): void { this.timers.push(setTimeout(f, ms)); }
  private vider(): void { this.timers.forEach(clearTimeout); this.timers = []; }
}
