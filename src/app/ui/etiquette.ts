import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TypeInfo } from '../core/types';

/** Étiquette compacte d'un combattant : type, nom, PV (avec la part perdue en fantôme), niveau, équipe. */
@Component({
  selector: 'app-etiquette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="haut">
      <img [src]="type().icon" alt="" width="20" height="20" />
      <strong class="disp">{{ nom() }}</strong>
      <span class="mono pv">{{ pv() }}/{{ max() }}</span>
    </div>
    <div class="jauge" role="img" [attr.aria-label]="nom() + ' : ' + pv() + ' points de vie sur ' + max()">
      <b [style.width.%]="fantome()"></b><i [style.width.%]="(pv() / max()) * 100" [class.bas]="pv() / max() < 0.3"></i>
    </div>
    <div class="bas-l">
      <span class="mono niv">N.{{ niveau() }}</span>
      <span class="banc" aria-hidden="true">@for (v of equipe(); track $index) {<i [class.ko]="!v"></i>}</span>
    </div>
  `,
  styles: `
    :host { display: grid; gap: 5px; width: 230px; padding: 8px 12px 9px; border: var(--trait); border-radius: 14px; background: #fff; box-shadow: 3px 3px 0 var(--color-encre); }
    .haut { display: flex; align-items: center; gap: 7px; }
    .haut img { border-radius: 50%; box-shadow: 0 0 0 1.5px var(--color-encre); }
    .haut strong { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; }
    .pv { font-size: 11px; }
    .jauge { position: relative; height: 9px; border: 2px solid var(--color-encre); border-radius: 999px; background: #fff; overflow: hidden; }
    .jauge b, .jauge i { position: absolute; inset: 0 auto 0 0; }
    .jauge b { background: var(--color-jaune); transition: width 0.5s 0.45s ease-out; }
    .jauge i { background: #4fae4a; transition: width 0.35s var(--ease-ressort); }
    .jauge i.bas { background: var(--color-rouge); }
    .bas-l { display: flex; justify-content: space-between; align-items: center; }
    .niv { font-size: 11px; font-weight: 700; }
    .banc { display: flex; gap: 3px; }
    .banc i { width: 9px; height: 9px; border: 1.5px solid var(--color-encre); border-radius: 50%; background: var(--color-rouge); }
    .banc i.ko { background: #fff; opacity: 0.5; }
  `,
})
export class Etiquette {
  readonly nom = input.required<string>();
  readonly type = input.required<TypeInfo>();
  readonly pv = input.required<number>();
  readonly max = input.required<number>();
  /** Largeur (%) de la part perdue encore visible, qui rattrape la barre avec un temps de retard. */
  readonly fantome = input(100);
  readonly niveau = input(1);
  readonly equipe = input<boolean[]>([]);
}
