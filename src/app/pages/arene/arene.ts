import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GYMS, LEAGUE, gymTeam, rivalTeam } from '../../core/game/campaign';
import { Card, cardOf, total } from '../../core/game/cards';
import { Action, DuelState, Fighter, TurnReport, Who, active, canUseTech, chooseMachineAction, createDuel, machineMood, resolve } from '../../core/game/duel';
import { PlayerStore } from '../../core/player.store';
import { PokedexService } from '../../core/pokedex.service';
import { animated, artwork } from '../../core/pokemon';
import { REGIONS, typeOf } from '../../core/types';

type Phase = 'prep' | 'fight' | 'end';
/** Cinq gestes d'encre : chaque type en utilise un, teinté de sa couleur. */
type FxShape = 'eclat' | 'vague' | 'foudre' | 'gravats' | 'anneaux' | 'coup';
const SHAPES: Record<string, FxShape> = {
  normal: 'eclat', combat: 'eclat', feu: 'eclat', dragon: 'eclat',
  eau: 'vague', glace: 'vague', vol: 'vague',
  electrik: 'foudre', acier: 'foudre',
  roche: 'gravats', sol: 'gravats', insecte: 'gravats', plante: 'gravats',
  psy: 'anneaux', fee: 'anneaux', spectre: 'anneaux', tenebres: 'anneaux', poison: 'anneaux',
};
const LABELS: Record<Action, string> = { frappe: 'Frappe', tech: 'Technique', garde: 'Garde' };
const KO_XP = 40;
const PLAY_XP = 10;

interface Fx { target: Who; shape: FxShape; color: string; amount: number }

@Component({
  selector: 'app-arene',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './arene.html',
  styleUrl: './arene.css',
})
export class Arene {
  private readonly dex = inject(PokedexService);
  protected readonly player = inject(PlayerStore);

  /** Présents dans l'adresse quand on vient de la campagne : /arene?region=1&gym=3 */
  readonly region = input<string>();
  readonly gym = input<string>();

  protected readonly phase = signal<Phase>('prep');
  protected readonly duel = signal<DuelState | null>(null);
  protected readonly report = signal<TurnReport | null>(null);
  protected readonly busy = signal(false);
  protected readonly fx = signal<Fx[]>([]);
  protected readonly gains = signal<{ name: string; xp: number; level: number; leveled: boolean }[]>([]);
  private kos: Record<number, number> = {};
  private rival: Card[] | null = null;
  private readonly rivalSeed = signal(0);

  protected readonly labels = LABELS;
  protected readonly actions: Action[] = ['frappe', 'tech', 'garde'];

  protected readonly challenge = computed(() => {
    const region = Number(this.region()), gym = Number(this.gym());
    if (!region || !gym || !GYMS[region - 1]) return null;
    const info = gym === LEAGUE ? null : GYMS[region - 1][gym - 1];
    return {
      region, gym,
      title: info ? `Arène ${typeOf(info.type).label} de ${info.leader}` : `Ligue de ${REGIONS[region - 1]}`,
      subtitle: info ? `Badge ${info.badge} · ${REGIONS[region - 1]}` : 'Les trois plus forts de la région',
      skill: Math.min(0.85, 0.4 + gym * 0.05),
    };
  });

  protected readonly myCards = computed(() => {
    const owned = this.player.owned();
    const ids = this.player.deck().length ? this.player.deck() : Object.keys(owned).map(Number).slice(0, 3);
    return ids.flatMap((id) => {
      const p = this.dex.get(id);
      return p ? [cardOf(p, owned[id]?.level ?? 1)] : [];
    });
  });

  protected readonly theirCards = computed(() => {
    const all = this.dex.all();
    const mine = this.myCards();
    if (!all.length || !mine.length) return [];
    const c = this.challenge();
    if (c) return gymTeam(all, c.region, c.gym);
    this.rivalSeed();
    const average = mine.reduce((sum, card) => sum + total(this.dex.get(card.id)!), 0) / mine.length;
    return (this.rival ??= rivalTeam(all, average));
  });

  protected readonly me = computed(() => this.side('player'));
  protected readonly foe = computed(() => this.side('machine'));
  protected readonly mood = computed(() => machineMood(this.duel()?.history ?? []));
  protected readonly techReady = computed(() => { const d = this.duel(); return !!d && canUseTech(d.player); });
  protected readonly won = computed(() => this.duel()?.winner === 'player');

  private side(who: Who) {
    const d = this.duel();
    if (!d) return null;
    const side = d[who], f = active(side);
    return {
      f, energy: side.energy, team: side.team,
      pips: Array.from({ length: d.rules.maxEnergy }, (_, i) => i < side.energy),
      hpPct: (f.hp / f.card.hp) * 100,
      ink: typeOf(f.card.types[0]),
      techInk: typeOf(f.card.tech.type),
      sprite: animated(f.card.id, who === 'player'),
    };
  }

  protected art(card: Card): string { return artwork(card.id); }
  protected ink(card: Card) { return typeOf(card.types[0]); }
  protected alive(f: Fighter): boolean { return f.hp > 0; }
  protected fxOn(who: Who): Fx | undefined { return this.fx().find((f) => f.target === who); }

  /** Certains Pokémon récents n'ont pas de sprite animé : on retombe sur l'illustration. */
  protected fallback(event: Event, id: number): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('official-artwork')) img.src = artwork(id);
  }

  protected reroll(): void {
    this.rival = null;
    this.rivalSeed.update((n) => n + 1);
  }

  protected start(): void {
    this.kos = {};
    this.report.set(null);
    this.duel.set(createDuel(this.myCards(), this.theirCards()));
    this.phase.set('fight');
  }

  protected play(action: Action): void {
    const state = this.duel();
    if (!state || this.busy() || state.winner) return;
    const machine = chooseMachineAction(state, Math.random, this.challenge()?.skill ?? 0.6);
    const before = { p: active(state.player).card, m: active(state.machine).card };
    const { state: next, report } = resolve(state, action, machine);
    if (report.scorer) this.kos[report.scorer] = (this.kos[report.scorer] ?? 0) + 1;

    // 1. On montre les deux choix et l'effet d'encre. 2. Les PV descendent. 3. La main revient au joueur.
    this.busy.set(true);
    this.report.set(report);
    const effects: Fx[] = [];
    if (report.toMachine) effects.push(this.makeFx('machine', report.player, before.p, report.toMachine));
    if (report.toPlayer) effects.push(this.makeFx('player', report.machine, before.m, report.toPlayer));
    this.fx.set(effects);
    setTimeout(() => this.duel.set(next), 420);
    setTimeout(() => {
      this.fx.set([]);
      this.busy.set(false);
      if (next.winner) this.finish(next.winner === 'player');
    }, 1050);
  }

  private makeFx(target: Who, action: Action, attacker: Card, amount: number): Fx {
    if (action !== 'tech') return { target, shape: 'coup', color: '#1E2340', amount };
    const type = typeOf(attacker.tech.type);
    return { target, shape: SHAPES[type.key], color: type.color, amount };
  }

  private finish(won: boolean): void {
    const before = this.player.owned();
    const gains = this.myCards().map((card) => {
      const xp = PLAY_XP + (this.kos[card.id] ?? 0) * KO_XP;
      const levelBefore = before[card.id]?.level ?? 1;
      this.player.gainCardXp(card.id, xp);
      const level = this.player.owned()[card.id]?.level ?? levelBefore;
      return { name: card.name, xp, level, leveled: level > levelBefore };
    });
    this.gains.set(gains);
    this.player.recordDuel(won);
    const c = this.challenge();
    if (won && c) this.player.winBadge(c.region, c.gym);
    this.phase.set('end');
  }

  protected again(): void {
    this.reroll();
    this.duel.set(null);
    this.phase.set('prep');
  }
}
