import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { AudioService } from '../core/audio.service';
import { moveOf } from '../core/game/cards';
import { capacitesParDefaut } from '../core/game/progression';
import { PlayerStore } from '../core/player.store';
import { PokedexService } from '../core/pokedex.service';
import { Pokemon, artwork, cry } from '../core/pokemon';
import { typeOf } from '../core/types';
import { Son } from './son';

export type Evenement =
  | { type: 'apprendre'; id: number; nom: string; capacite: number }
  | { type: 'evolution'; de: Pokemon; vers: Pokemon };

type PhaseEvo = 'anim' | 'fini' | 'annule';
const DUREE_EVOLUTION = 4600;

/**
 * Ce qui suit un duel, comme dans les jeux, une étape à la fois :
 * « X veut apprendre Y… Laquelle oublier ? », puis « Quoi ? X évolue ! » (que l'on peut annuler).
 */
@Component({
  selector: 'app-apres-duel',
  imports: [Son],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (courant(); as e) {
      <div class="voile" role="dialog" aria-modal="true" [attr.aria-label]="e.type === 'evolution' ? 'Évolution' : 'Nouvelle capacité'">
        @switch (e.type) {
          @case ('apprendre') {
            @let nouvelle = capacite(e.capacite);
            <div class="boite card">
              @if (annonce(); as a) {
                <p class="phrase disp">{{ a }}</p>
                <button type="button" class="btn" son="confirmation" (click)="suivant()">Continuer</button>
              } @else {
                <p class="phrase disp">{{ e.nom }} veut apprendre <span class="nom">{{ nouvelle.m.nom }}</span>.</p>
                <p class="sous">Mais {{ e.nom }} connaît déjà quatre capacités. Laquelle oublier pour faire de la place ?</p>
                <div class="nouvelle capa" [style.--c]="nouvelle.ink.color" [style.--t]="nouvelle.ink.text">
                  <strong class="disp"><img [src]="nouvelle.ink.icon" alt="" width="20" height="20" />{{ nouvelle.m.nom }}</strong>
                  <span class="mono">Puiss. {{ nouvelle.m.puissance }} · Préc. {{ nouvelle.m.precision ? nouvelle.m.precision + ' %' : '—' }} · PP {{ nouvelle.m.pp }}</span>
                  <span class="neuf mono">Nouvelle</span>
                </div>
                <div class="choix">
                  @for (c of connues(); track c.m.id) {
                    <button type="button" class="capa" son="confirmation" [style.--c]="c.ink.color" [style.--t]="c.ink.text" (click)="oublier(e, c.m.id)">
                      <strong class="disp"><img [src]="c.ink.icon" alt="" width="18" height="18" />{{ c.m.nom }}</strong>
                      <span class="mono">Puiss. {{ c.m.puissance }} · Préc. {{ c.m.precision ? c.m.precision + ' %' : '—' }}</span>
                    </button>
                  }
                </div>
                <button type="button" class="lien" son="selection" (click)="garder(e)">Ne pas apprendre {{ nouvelle.m.nom }}</button>
              }
            </div>
          }
          @case ('evolution') {
            <div class="boite card evo" [attr.data-phase]="phaseEvo()">
              <div class="scene-evo dots">
                <span class="halo"></span>
                <img class="de" [src]="art(e.de)" [alt]="e.de.name" />
                <img class="vers" [src]="art(e.vers)" [alt]="e.vers.name" />
              </div>
              <p class="phrase disp" aria-live="polite">
                @switch (phaseEvo()) {
                  @case ('anim') { Quoi ? {{ e.de.name }} évolue ! }
                  @case ('fini') { Félicitations ! {{ e.de.name }} a évolué en {{ e.vers.name }} ! }
                  @case ('annule') { Hein ? {{ e.de.name }} n’a pas évolué ! }
                }
              </p>
              @if (phaseEvo() === 'anim') {
                <button type="button" class="btn ghost" son="selection" (click)="annuler()">Annuler l’évolution</button>
              } @else {
                <button type="button" class="btn" son="confirmation" (click)="suivant()">Continuer</button>
              }
            </div>
          }
        }
      </div>
    }
  `,
  styles: `
    .voile { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 16px; background: rgb(30 35 64 / 0.55); animation: fondu 0.25s ease-out; }
    .boite { display: grid; gap: 14px; justify-items: start; width: min(560px, 100%); padding: 26px; border-radius: 26px; animation: monter 0.35s var(--ease-ressort); }
    .phrase { margin: 0; font-size: 26px; line-height: 1.2; }
    .nom { color: var(--color-rouge); }
    .sous { margin: 0; color: var(--color-encre-douce); }
    .capa { position: relative; display: grid; gap: 2px; padding: 10px 14px; text-align: left; border: var(--trait); border-radius: 16px; background: var(--c); color: var(--t); box-shadow: 4px 4px 0 var(--color-encre); font-size: 11.5px; }
    .capa strong { display: flex; align-items: center; gap: 8px; font-size: 18px; }
    .capa img { border-radius: 50%; box-shadow: 0 0 0 1.5px var(--color-encre); }
    .nouvelle { width: 100%; }
    .neuf { position: absolute; top: -10px; right: 12px; padding: 2px 8px; border: 2px solid var(--color-encre); border-radius: 999px; background: var(--color-jaune); color: var(--color-encre); font-size: 10.5px; font-weight: 700; }
    .choix { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; width: 100%; }
    button.capa { transition: transform 0.25s var(--ease-ressort); }
    button.capa:hover { transform: translate(-2px, -3px) rotate(-1deg); }
    .lien { padding: 0; border: 0; background: none; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; }
    .evo { justify-items: center; text-align: center; }
    .scene-evo { position: relative; display: grid; place-items: center; width: 100%; height: 260px; overflow: hidden; border: var(--trait); border-radius: 20px; background-color: var(--color-papier-fort); }
    .scene-evo img { grid-area: 1 / 1; width: 200px; height: 200px; object-fit: contain; }
    .halo { grid-area: 1 / 1; width: 220px; height: 220px; border: 4px solid var(--color-jaune); border-radius: 50%; box-shadow: 0 0 0 10px rgb(255 201 60 / 0.35); }
    [data-phase='anim'] img { filter: brightness(0) invert(1) drop-shadow(0 0 2px var(--color-encre)) drop-shadow(0 0 1px var(--color-encre)); }
    [data-phase='anim'] .de { animation: alterne 4.6s step-end both; }
    [data-phase='anim'] .vers { animation: alterne 4.6s step-end reverse both; }
    [data-phase='anim'] .halo { animation: pulse 0.9s ease-in-out infinite; }
    [data-phase='fini'] .de, [data-phase='annule'] .vers { opacity: 0; }
    [data-phase='fini'] .vers, [data-phase='annule'] .de { animation: apparition 0.6s var(--ease-ressort); }
    [data-phase='fini'] .halo { animation: eclat 0.7s ease-out forwards; }
    [data-phase='annule'] .halo { opacity: 0; }
    @keyframes alterne {
      0%, 30%, 45%, 52%, 62%, 67%, 74%, 78%, 83%, 86%, 89%, 91%, 93%, 95%, 97% { opacity: 1; }
      20%, 40%, 48%, 58%, 64%, 71%, 76%, 81%, 85%, 88%, 90%, 92%, 94%, 96%, 98%, 100% { opacity: 0; }
    }
    @keyframes pulse { 50% { transform: scale(1.12); box-shadow: 0 0 0 22px rgb(255 201 60 / 0.15); } }
    @keyframes eclat { from { transform: scale(0.6); opacity: 1; } to { transform: scale(1.8); opacity: 0; } }
    @keyframes apparition { from { transform: scale(0.6); filter: brightness(0) invert(1); } }
    @keyframes fondu { from { opacity: 0; } }
    @keyframes monter { from { transform: translateY(30px) scale(0.95); opacity: 0; } }
    @media (max-width: 860px) {
      .boite { padding: 20px; }
      .phrase { font-size: 21px; }
      .choix { grid-template-columns: 1fr; }
      .scene-evo { height: 210px; }
      .scene-evo img { width: 160px; height: 160px; }
    }
    @media (prefers-reduced-motion: reduce) { .de, .vers, .halo, .boite, .voile { animation: none !important; } }
  `,
})
export class ApresDuel {
  private readonly player = inject(PlayerStore);
  private readonly dex = inject(PokedexService);
  private readonly audio = inject(AudioService);
  readonly evenements = input.required<Evenement[]>();

  private readonly indice = signal(0);
  protected readonly annonce = signal<string | null>(null);
  protected readonly phaseEvo = signal<PhaseEvo>('anim');
  private minuterie?: ReturnType<typeof setTimeout>;

  protected readonly courant = computed(() => this.evenements()[this.indice()] ?? null);

  /** Les quatre capacités du Pokémon concerné, telles qu'il les connaît maintenant. */
  protected readonly connues = computed(() => {
    const e = this.courant();
    if (!e || e.type !== 'apprendre') return [];
    const o = this.player.owned()[e.id];
    const p = this.dex.get(e.id);
    const ids = o?.moves ?? (p && o ? capacitesParDefaut(p, o.level) : []);
    return ids.map((id) => this.capacite(id));
  });

  constructor() {
    effect(() => {
      this.evenements();
      this.indice.set(0);
    });
    // Chaque évolution démarre sa scène ; au bout de l'animation, elle se fait.
    effect(() => {
      const e = this.courant();
      clearTimeout(this.minuterie);
      if (e?.type !== 'evolution') return;
      this.phaseEvo.set('anim');
      this.minuterie = setTimeout(() => this.evoluer(e.de, e.vers), DUREE_EVOLUTION);
    });
  }

  protected capacite(id: number) {
    const m = moveOf(id);
    return { m, ink: typeOf(m.type) };
  }

  protected art(p: Pokemon): string {
    return artwork(p.id, !!this.player.owned()[p.id]?.shiny);
  }

  protected oublier(e: Evenement & { type: 'apprendre' }, oubliee: number): void {
    const ids = this.connues().map((c) => c.m.id);
    this.player.apprendre(e.id, e.capacite, ids, oubliee);
    this.annonce.set(`1, 2 et… Tada ! ${e.nom} oublie ${moveOf(oubliee).nom} et apprend ${moveOf(e.capacite).nom} !`);
  }

  protected garder(e: Evenement & { type: 'apprendre' }): void {
    this.annonce.set(`${e.nom} n’a pas appris ${moveOf(e.capacite).nom}.`);
  }

  protected annuler(): void {
    clearTimeout(this.minuterie);
    this.phaseEvo.set('annule');
  }

  private evoluer(de: Pokemon, vers: Pokemon): void {
    this.player.evolve(de.id, vers.id);
    this.phaseEvo.set('fini');
    this.audio.cri(cry(vers.id));
  }

  protected suivant(): void {
    this.annonce.set(null);
    this.indice.update((i) => i + 1);
  }
}
