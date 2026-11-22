import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { TYPES, TypeInfo, effectiveness } from '../core/types';

type Sens = 'attaque' | 'defense';
interface Case { type: TypeInfo; factor: number; etat: 'choisi' | 'fort' | 'faible' | 'nul' | 'neutre' | 'repos' }

const fr = (n: number) => String(n).replace('.', ',');
const liste = (c: Case[]) => c.map((x) => x.type.label).join(', ');

/**
 * Bande des forces : on choisit un type, les 17 autres s'allument selon qu'il les bat ou non.
 * Remplace la bande décorative de l'accueil par quelque chose qui apprend les types en jouant.
 */
@Component({
  selector: 'app-type-forces',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tete page">
      <p class="eyebrow">La bande des forces</p>
      <div class="sens" role="group" aria-label="Sens de lecture">
        <button type="button" class="chip" [class.on]="sens() === 'attaque'" [attr.aria-pressed]="sens() === 'attaque'" (click)="sens.set('attaque')">En attaque</button>
        <button type="button" class="chip" [class.on]="sens() === 'defense'" [attr.aria-pressed]="sens() === 'defense'" (click)="sens.set('defense')">En défense</button>
      </div>
    </div>
    <div class="bande" role="group" aria-label="Choisis un type" (pointerleave)="apercu.set(null)">
      @for (c of cases(); track c.type.id) {
        <button type="button" class="case" [attr.data-etat]="c.etat" [attr.aria-pressed]="c.etat === 'choisi'"
          [style.--c]="c.type.color" [style.--t]="c.type.text"
          (click)="choisir(c.type.id)" (pointerenter)="apercu.set(c.type.id)" (focus)="apercu.set(c.type.id)" (blur)="apercu.set(null)">
          <img [src]="c.type.icon" alt="" width="40" height="40" />
          <span class="nom">{{ c.type.label }}</span>
          @if (c.etat !== 'choisi' && c.etat !== 'repos' && c.etat !== 'neutre') {
            <span class="x mono">×{{ fr(c.factor) }}</span>
          }
        </button>
      }
    </div>
    <p class="verdict page" aria-live="polite">{{ verdict() }}</p>
  `,
  styles: `
    :host { display: block; padding: 22px 0 18px; border-block: var(--trait); background: var(--color-papier-fort); }
    .tete { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .tete .eyebrow { margin: 0; }
    .sens { display: flex; gap: 8px; }
    .bande { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px 10px; max-width: 900px; margin: 0 auto; padding: 22px 16px 10px; }
    .case {
      position: relative; flex: none; display: grid; justify-items: center; gap: 6px; width: 84px; padding: 10px 4px 9px;
      border: 2px solid var(--color-encre); border-radius: 16px; background: var(--c); color: var(--t);
      font: 700 12px/1 var(--font-texte); cursor: pointer;
      transition: transform 0.3s var(--ease-ressort), opacity 0.2s, filter 0.2s, box-shadow 0.2s;
    }
    .case img { width: 40px; height: 40px; border-radius: 50%; box-shadow: 0 0 0 2px var(--color-encre); }
    .case:focus-visible { outline: 3px solid var(--color-rouge); outline-offset: 3px; }
    .case[data-etat='neutre'] { opacity: 0.45; filter: grayscale(1); }
    .case[data-etat='choisi'] { transform: translateY(-6px) scale(1.08); box-shadow: 4px 4px 0 var(--color-encre); }
    .case[data-etat='fort'] { transform: translateY(-4px); box-shadow: 3px 3px 0 var(--color-encre); }
    .case[data-etat='faible'] { opacity: 0.8; }
    .case[data-etat='nul'] { opacity: 0.7; border-style: dashed; }
    .case[data-etat='nul'] .nom { text-decoration: line-through; }
    .x {
      position: absolute; top: -10px; right: -8px; padding: 3px 6px; border: 2px solid var(--color-encre); border-radius: 999px;
      font-size: 11px; background: #fff; color: var(--color-encre); transform: rotate(6deg);
    }
    [data-etat='fort'] .x { background: var(--color-jaune); }
    [data-etat='faible'] .x { background: #fff; }
    [data-etat='nul'] .x { background: var(--color-encre); color: #fff; }
    .verdict { margin: 4px auto 0; min-height: 1.5em; font-size: 15px; color: var(--color-encre); }
    @media (max-width: 600px) {
      .bande { gap: 12px 8px; }
      .case { width: 64px; padding: 8px 2px 7px; font-size: 11px; }
      .case img { width: 32px; height: 32px; }
    }
    @media (prefers-reduced-motion: reduce) { .case { transition: none; } }
  `,
})
export class TypeForces {
  /** Type choisi au départ (par exemple le type du jour). */
  readonly depart = input<number | null>(null);

  protected readonly fr = fr;
  protected readonly sens = signal<Sens>('attaque');
  protected readonly apercu = signal<number | null>(null);
  private readonly choix = signal<number | null>(null);

  /** Le type montré : celui qu'on survole, sinon celui qu'on a choisi, sinon celui de départ. */
  private readonly actif = computed(() => this.apercu() ?? this.choix() ?? this.depart());

  protected readonly cases = computed<Case[]>(() => {
    const a = this.actif();
    return TYPES.map((type) => {
      if (a === null) return { type, factor: 1, etat: 'repos' as const };
      if (type.id === a) return { type, factor: 1, etat: 'choisi' as const };
      const factor = this.sens() === 'attaque' ? effectiveness(a, [type.id]) : effectiveness(type.id, [a]);
      // En défense, prendre ×2 est une mauvaise nouvelle : on inverse la lecture.
      const bon = this.sens() === 'attaque' ? factor > 1 : factor < 1;
      const etat = factor === 1 ? 'neutre' : factor === 0 ? 'nul' : bon ? 'fort' : 'faible';
      return { type, factor, etat };
    });
  });

  protected readonly verdict = computed(() => {
    const a = this.actif();
    if (a === null) return 'Survole ou touche un type pour voir qui il bat.';
    const nom = TYPES[a - 1].label;
    const c = this.cases();
    const par = (e: Case['etat']) => c.filter((x) => x.etat === e);
    if (this.sens() === 'attaque') {
      const parts = [
        par('fort').length && `très efficace contre ${liste(par('fort'))}`,
        par('faible').length && `peu efficace contre ${liste(par('faible'))}`,
        par('nul').length && `sans effet sur ${liste(par('nul'))}`,
      ].filter(Boolean);
      return `Une attaque ${nom} est ${parts.join(' ; ')}.`;
    }
    const parts = [
      par('faible').length && `craint ${liste(par('faible'))}`,
      par('fort').length && `résiste à ${liste(par('fort'))}`,
      par('nul').length && `ne craint rien de ${liste(par('nul'))}`,
    ].filter(Boolean);
    return `Un Pokémon ${nom} ${parts.join(' ; ')}.`;
  });

  protected choisir(id: number): void {
    this.choix.set(this.choix() === id ? null : id);
    this.apercu.set(null);
  }
}
