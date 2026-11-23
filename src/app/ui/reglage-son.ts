import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { AudioService } from '../core/audio.service';

/** Le bouton du son dans la barre du haut : il ouvre un petit menu avec deux interrupteurs. */
@Component({
  selector: 'app-reglage-son',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let musique = audio.actif();
    @let bruitages = audio.bruitages();
    <button type="button" class="son" [class.on]="musique || bruitages" (click)="ouvert.set(!ouvert())" [attr.aria-expanded]="ouvert()" aria-haspopup="true" aria-controls="menu-son" aria-label="Réglages du son" title="Réglages du son">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        @if (musique || bruitages) {
          <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
        } @else {
          <path d="M17 9l5 6M22 9l-5 6" />
        }
      </svg>
    </button>
    @if (ouvert()) {
      <div class="menu" id="menu-son" role="group" aria-label="Réglages du son">
        <p class="titre mono">Son</p>
        <label class="ligne">
          <span><strong>Musique</strong><small>Les thèmes Or HeartGold et Argent SoulSilver</small></span>
          <input type="checkbox" role="switch" [checked]="musique" (change)="audio.basculer()" />
          <i class="interrupteur" aria-hidden="true"></i>
        </label>
        <label class="ligne">
          <span><strong>Effets sonores</strong><small>Boutons, Pokéball, rencontres</small></span>
          <input type="checkbox" role="switch" [checked]="bruitages" (change)="basculerBruitages()" />
          <i class="interrupteur" aria-hidden="true"></i>
        </label>
      </div>
    }
  `,
  styles: `
    :host { position: relative; display: block; flex: none; }
    .son { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: var(--trait); border-radius: 50%; background: #fff; color: var(--color-encre-douce); box-shadow: 4px 4px 0 var(--color-encre); transition: transform 0.25s var(--ease-ressort); }
    .son:hover { transform: translate(-2px, -2px); }
    .son.on { background: var(--color-jaune); color: var(--color-encre); }
    .menu { position: absolute; top: calc(100% + 12px); right: -8px; z-index: 50; display: grid; gap: 4px; width: 280px; padding: 12px 14px 10px; border: var(--trait); border-radius: 18px; background: #fff; box-shadow: 5px 5px 0 var(--color-encre); animation: deplier 0.25s var(--ease-ressort); transform-origin: top right; }
    .titre { margin: 0 0 4px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-encre-douce); }
    .ligne { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; cursor: pointer; }
    .ligne + .ligne { border-top: 1.5px dashed var(--color-encre-douce); }
    .ligne span { display: grid; gap: 1px; }
    .ligne strong { font-size: 15px; }
    .ligne small { font-size: 12px; color: var(--color-encre-douce); }
    .ligne input { position: absolute; opacity: 0; width: 1px; height: 1px; }
    .interrupteur { position: relative; flex: none; width: 46px; height: 26px; border: var(--trait); border-radius: 999px; background: var(--color-papier-fort); transition: background 0.2s; }
    .interrupteur::after { content: ''; position: absolute; top: 2px; left: 2px; width: 17px; height: 17px; border: 2px solid var(--color-encre); border-radius: 50%; background: #fff; transition: transform 0.25s var(--ease-ressort); }
    input:checked + .interrupteur { background: var(--color-jaune); }
    input:checked + .interrupteur::after { transform: translateX(20px); }
    input:focus-visible + .interrupteur { outline: 3px solid var(--color-rouge); outline-offset: 2px; }
    @keyframes deplier { from { transform: scale(0.85); opacity: 0; } }
    @media (max-width: 860px) {
      .son { width: 38px; height: 38px; box-shadow: 3px 3px 0 var(--color-encre); }
      .menu { right: -60px; width: 260px; }
    }
  `,
})
export class ReglageSon {
  protected readonly audio = inject(AudioService);
  protected readonly ouvert = signal(false);
  private readonly hote = inject(ElementRef<HTMLElement>);

  protected basculerBruitages(): void {
    this.audio.basculerBruitages();
    this.audio.effet('selection');
  }

  @HostListener('document:click', ['$event'])
  protected dehors(e: MouseEvent): void {
    if (this.ouvert() && !this.hote.nativeElement.contains(e.target as Node)) this.ouvert.set(false);
  }

  @HostListener('document:keydown.escape')
  protected echap(): void { this.ouvert.set(false); }
}
