import { Son } from './son';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RencontreService } from '../core/rencontre.service';
import { animated, artwork } from '../core/pokemon';
import { typeOf } from '../core/types';

/** La bulle « ! » puis la carte « Un Pokémon sauvage veut se battre ! », en bas à droite. */
@Component({
  imports: [Son],
  selector: 'app-rencontre-sauvage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (vue(); as v) {
      <aside class="zone" [class.carte]="v.r.etape !== 'bulle'" role="alertdialog" aria-live="assertive" [attr.aria-label]="v.titre">
        <span class="bulle disp" aria-hidden="true">!</span>
        @if (v.r.etape === 'carte') {
          <div class="corps">
            <div class="scene dots" [style.background-color]="v.ink.color">
              <img [src]="v.sprite" [alt]="v.r.pokemon.name" (error)="repli($event, v.r.pokemon.id)" />
              @if (v.r.nouveau) { <span class="neuf mono">Nouveau !</span> }
              @if (v.r.chromatique) { <span class="neuf chroma mono">Chromatique ✦</span> }
            </div>
            <p class="titre disp">{{ v.titre }}</p>
            <div class="choix">
              <button type="button" class="btn sm" son="confirmation" (click)="r.combattre()">Combattre</button>
              <button type="button" class="btn ghost sm" son="selection" (click)="r.fuir()">Fuir</button>
            </div>
            <span class="minuteur" aria-hidden="true"></span>
          </div>
        } @else if (v.r.etape === 'fuite') {
          <p class="fin mono">{{ v.r.fin }}</p>
        }
      </aside>
    }
  `,
  styles: `
    .zone { position: fixed; right: 22px; bottom: 22px; z-index: 40; display: grid; justify-items: end; gap: 10px; }
    .bulle { display: grid; place-items: center; width: 64px; height: 64px; border: var(--trait); border-radius: 18px 18px 18px 4px; background: #fff; color: var(--color-rouge); font-size: 46px; line-height: 1; box-shadow: 4px 4px 0 var(--color-encre); animation: surgir 0.45s var(--ease-ressort) both, vibrer 0.5s 0.45s; }
    .carte .bulle { width: 44px; height: 44px; font-size: 30px; border-radius: 14px 14px 14px 4px; animation: none; }
    .corps { position: relative; width: 290px; padding: 12px 12px 14px; overflow: hidden; border: var(--trait); border-radius: 22px; background: #fff; box-shadow: 6px 6px 0 var(--color-encre); animation: deplier 0.4s var(--ease-ressort) both; }
    .scene { position: relative; display: grid; place-items: end center; height: 120px; padding-bottom: 8px; border: 2px solid var(--color-encre); border-radius: 14px; }
    .scene img { max-height: 100px; max-width: 140px; image-rendering: pixelated; animation: secouer 1.2s 0.3s infinite; }
    .neuf { position: absolute; top: 8px; left: 8px; padding: 2px 8px; border: 2px solid var(--color-encre); border-radius: 999px; background: var(--color-jaune); font-size: 11px; font-weight: 700; }
    .chroma { left: auto; right: 8px; background: #fff; }
    .titre { margin: 10px 2px 10px; font-size: 19px; line-height: 1.2; }
    .choix { display: flex; gap: 10px; }
    .choix .btn { flex: 1; justify-content: center; }
    .minuteur { position: absolute; left: 0; bottom: 0; height: 5px; width: 100%; background: var(--color-rouge); transform-origin: left; animation: decompter 14s linear forwards; }
    .fin { margin: 0; padding: 10px 16px; border: var(--trait); border-radius: 14px; background: #fff; box-shadow: 4px 4px 0 var(--color-encre); font-size: 13px; }
    @keyframes surgir { from { transform: translateY(30px) scale(0.3); opacity: 0; } }
    @keyframes vibrer { 20%, 60% { transform: rotate(-12deg); } 40%, 80% { transform: rotate(12deg); } }
    @keyframes deplier { from { transform: translateY(20px) scale(0.85); opacity: 0; } }
    @keyframes secouer { 0%, 70%, 100% { transform: none; } 78% { transform: translateX(-4px); } 86% { transform: translateX(4px); } }
    @keyframes decompter { to { transform: scaleX(0); } }
    @media (max-width: 640px) {
      .zone { left: 12px; right: 12px; bottom: 12px; }
      .corps { width: 100%; box-sizing: border-box; }
    }
    @media (prefers-reduced-motion: reduce) { .bulle, .corps, .scene img { animation: none; } }
  `,
})
export class RencontreSauvage {
  protected readonly r = inject(RencontreService);

  protected readonly vue = computed(() => {
    const r = this.r.courante();
    if (!r) return null;
    return { r, ink: typeOf(r.pokemon.types[0]), sprite: animated(r.pokemon.id), titre: `Un ${r.pokemon.name} sauvage veut se battre !` };
  });

  protected repli(event: Event, id: number): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('official-artwork')) img.src = artwork(id);
  }
}
