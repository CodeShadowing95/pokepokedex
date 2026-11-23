import { Son } from './son';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FACTEURS, cri, detail, facteurFr, tirage } from '../core/duel-express';
import { TYPES, effectiveness } from '../core/types';

type Mode = 'explorer' | 'quiz';

/**
 * Duel express : un attaquant, un défenseur (un ou deux types), et le tampon du multiplicateur.
 * Mode quiz : le site tire un duel, on devine le multiplicateur avant de voir la réponse.
 */
@Component({
  selector: 'app-duel-express',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modes" role="group" aria-label="Mode">
      <button type="button" class="chip" [class.on]="mode() === 'explorer'" [attr.aria-pressed]="mode() === 'explorer'" (click)="mode.set('explorer')">Explorer</button>
      <button type="button" class="chip" [class.on]="mode() === 'quiz'" [attr.aria-pressed]="mode() === 'quiz'" son="confirmation" (click)="lancerQuiz()">Quiz</button>
    </div>

    @if (mode() === 'explorer') {
      <div class="arene-x">
        <section class="camp" aria-labelledby="t-att">
          <h3 id="t-att">Attaquant <span class="mono">un type</span></h3>
          <div class="grille">
            @for (t of types; track t.id) {
              <button type="button" class="tt" [class.pris]="attaque() === t.id" [attr.aria-pressed]="attaque() === t.id"
                [style.--c]="t.color" [style.--t]="t.text" son="selection" (click)="attaque.set(t.id)">
                <img [src]="t.icon" alt="" width="30" height="30" /><span>{{ t.label }}</span>
              </button>
            }
          </div>
        </section>

        <div class="centre">
          <ng-container *ngTemplateOutlet="tampon" />
          <p class="phrase">
            Une attaque <strong>{{ nom(attaque()) }}</strong> contre un Pokémon <strong>{{ noms(defense()) }}</strong>
          </p>
          @if (defense().length > 1) {
            <p class="calcul mono">
              @for (d of details(); track d.type.id) {<span>{{ d.type.label }} ×{{ fr(d.f) }}</span>}
              <span>= ×{{ fr(facteur()) }}</span>
            </p>
          }
        </div>

        <section class="camp" aria-labelledby="t-def">
          <h3 id="t-def">Défenseur <span class="mono">un ou deux types</span></h3>
          <div class="grille">
            @for (t of types; track t.id) {
              <button type="button" class="tt" [class.pris]="defense().includes(t.id)" [attr.aria-pressed]="defense().includes(t.id)"
                [style.--c]="t.color" [style.--t]="t.text" son="selection" (click)="basculer(t.id)">
                <img [src]="t.icon" alt="" width="30" height="30" /><span>{{ t.label }}</span>
              </button>
            }
          </div>
        </section>
      </div>
    } @else {
      <div class="quiz">
        <p class="score mono" aria-live="polite">Score {{ bons() }} / {{ joues() }} · série {{ serie() }}</p>
        <div class="face">
          <span class="pill" [style.--c]="typeDe(q().attaque).color" [style.--t]="typeDe(q().attaque).text">
            <img [src]="typeDe(q().attaque).icon" alt="" width="34" height="34" />{{ nom(q().attaque) }}
          </span>
          <span class="contre disp">attaque</span>
          @for (d of q().defense; track d) {
            <span class="pill" [style.--c]="typeDe(d).color" [style.--t]="typeDe(d).text">
              <img [src]="typeDe(d).icon" alt="" width="34" height="34" />{{ nom(d) }}
            </span>
          }
        </div>
        @if (reponse() === null) {
          <p class="question disp">Combien de dégâts ?</p>
          <div class="choix">
            @for (f of facteurs; track f) {
              <button type="button" class="btn ghost" son="confirmation" (click)="repondre(f)">×{{ fr(f) }}</button>
            }
          </div>
        } @else {
          <p class="question disp" [class.ok]="juste()">{{ juste() ? 'Bien vu !' : 'Raté, c’était ×' + fr(facteur()) }}</p>
          <ng-container *ngTemplateOutlet="tampon" />
          @if (q().defense.length > 1) {
            <p class="calcul mono">
              @for (d of details(); track d.type.id) {<span>{{ d.type.label }} ×{{ fr(d.f) }}</span>}
              <span>= ×{{ fr(facteur()) }}</span>
            </p>
          }
          <button type="button" class="btn" son="confirmation" (click)="suivante()">Question suivante</button>
        }
      </div>
    }

    <ng-template #tampon>
      @for (k of [cle()]; track k) {
        <div class="tampon" [attr.data-niveau]="niveau()" role="status">
          <span class="x disp">×{{ fr(facteur()) }}</span>
          <span class="cri mono">{{ cri(facteur()) }}</span>
        </div>
      }
    </ng-template>
  `,
  imports: [Son, NgTemplateOutlet],
  styleUrl: './duel-express.css',
})
export class DuelExpress {
  protected readonly types = TYPES;
  protected readonly facteurs = FACTEURS;
  protected readonly fr = facteurFr;
  protected readonly cri = cri;

  protected readonly mode = signal<Mode>('explorer');
  protected readonly attaque = signal(11);
  protected readonly defense = signal<number[]>([10, 6]);

  protected readonly q = signal(tirage());
  protected readonly reponse = signal<number | null>(null);
  protected readonly bons = signal(0);
  protected readonly joues = signal(0);
  protected readonly serie = signal(0);

  private readonly duel = computed(() =>
    this.mode() === 'quiz' ? { a: this.q().attaque, d: this.q().defense } : { a: this.attaque(), d: this.defense() },
  );
  protected readonly facteur = computed(() => effectiveness(this.duel().a, this.duel().d));
  protected readonly details = computed(() => detail(this.duel().a, this.duel().d));
  protected readonly juste = computed(() => this.reponse() === this.facteur());
  /** Change à chaque nouveau duel : sert à rejouer l'animation du tampon. */
  protected readonly cle = computed(() => `${this.duel().a}-${this.duel().d.join('-')}-${this.joues()}`);
  protected readonly niveau = computed(() => {
    const f = this.facteur();
    return f === 0 ? 'nul' : f > 1 ? 'fort' : f < 1 ? 'faible' : 'neutre';
  });

  protected typeDe(id: number) {
    return TYPES[id - 1];
  }
  protected nom(id: number): string {
    return TYPES[id - 1].label;
  }
  protected noms(ids: readonly number[]): string {
    return ids.map((i) => this.nom(i)).join(' / ');
  }

  /** Deux types au plus : un troisième clic remplace le plus ancien. */
  protected basculer(id: number): void {
    const d = this.defense();
    if (d.includes(id)) {
      if (d.length > 1) this.defense.set(d.filter((x) => x !== id));
      return;
    }
    this.defense.set(d.length < 2 ? [...d, id] : [d[1], id]);
  }

  protected lancerQuiz(): void {
    this.mode.set('quiz');
    this.reponse.set(null);
  }
  protected repondre(f: number): void {
    this.reponse.set(f);
    this.joues.update((n) => n + 1);
    if (f === this.facteur()) {
      this.bons.update((n) => n + 1);
      this.serie.update((n) => n + 1);
    } else {
      this.serie.set(0);
    }
  }
  protected suivante(): void {
    this.q.set(tirage());
    this.reponse.set(null);
  }
}
