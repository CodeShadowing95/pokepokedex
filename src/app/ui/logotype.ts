import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * Logotype maison : un clin d'œil au logo d'origine (lettres jaunes cernées d'encre),
 * dessiné avec nos propres polices et couleurs. Ce n'est pas le logo officiel.
 */
@Component({
  selector: 'app-logotype',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.compact]': 'compact()', role: 'img', '[attr.aria-label]': '"Pokédex, édition Papier & Encre"' },
  template: `
    <span class="mot" aria-hidden="true">P<span class="balle"></span>kédex</span>
    <span class="tampon" aria-hidden="true">Édition Papier &amp; Encre</span>
  `,
  styles: `
    :host { --t: 46px; display: inline-flex; flex-direction: column; align-items: center; gap: 2px; line-height: 1; user-select: none; }
    :host(.compact) { --t: 27px; }
    .mot {
      display: inline-flex; align-items: center;
      font: 800 var(--t) / 1 var(--font-titre); letter-spacing: -0.02em;
      color: var(--color-jaune);
      -webkit-text-stroke: calc(var(--t) * 0.16) var(--color-encre); paint-order: stroke fill;
      text-shadow: calc(var(--t) * 0.08) calc(var(--t) * 0.08) 0 var(--color-encre);
      transform: rotate(-3deg);
    }
    .balle {
      position: relative; width: calc(var(--t) * 0.62); height: calc(var(--t) * 0.62); margin: calc(var(--t) * 0.12) 0.04em 0;
      border: calc(var(--t) * 0.07) solid var(--color-encre); border-radius: 50%;
      background: linear-gradient(var(--color-rouge) 0 44%, var(--color-encre) 44% 56%, #fff 56%);
      box-shadow: calc(var(--t) * 0.08) calc(var(--t) * 0.08) 0 var(--color-encre);
    }
    .balle::after {
      content: ''; position: absolute; left: 50%; top: 50%; width: 34%; height: 34%; transform: translate(-50%, -50%);
      border: calc(var(--t) * 0.05) solid var(--color-encre); border-radius: 50%; background: #fff;
    }
    .tampon {
      margin-top: calc(var(--t) * 0.1); padding: calc(var(--t) * 0.08) calc(var(--t) * 0.22);
      border: 2px solid var(--color-encre); border-radius: 4px; background: var(--color-rouge); color: #fff;
      font: 700 calc(var(--t) * 0.24) / 1 var(--font-mono); letter-spacing: 0.14em; text-transform: uppercase; white-space: nowrap;
      box-shadow: 2px 2px 0 var(--color-encre); transform: rotate(-3deg);
    }
    :host(:hover) .balle { animation: secouer 0.6s var(--ease-ressort); }
    @keyframes secouer { 25% { transform: rotate(-18deg); } 60% { transform: rotate(12deg); } }
    @media (prefers-reduced-motion: reduce) { :host(:hover) .balle { animation: none; } }
  `,
})
export class Logotype {
  readonly compact = input(false, { transform: booleanAttribute });
}
