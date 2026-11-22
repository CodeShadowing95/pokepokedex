import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GYMS, LEAGUE, gymTeam, rivalTeam } from '../../core/game/campaign';
import { Card, cardOf, total } from '../../core/game/cards';
import { Action, DuelState, Fighter, TurnReport, Who, active, canUseTech, chooseMachineAction, createDuel, machineMood, resolve } from '../../core/game/duel';
import { PlayerStore } from '../../core/player.store';
import { PokedexService } from '../../core/pokedex.service';
import { animated, artwork } from '../../core/pokemon';
import { REGIONS, typeOf } from '../../core/types';
import { sequence } from '../../core/game/sequence';
import { EffetSprite } from '../../ui/effet-sprite';
import { Etiquette } from '../../ui/etiquette';

type Phase = 'prep' | 'fight' | 'end';
const LABELS: Record<Action, string> = { frappe: 'Frappe', tech: 'Technique', garde: 'Garde' };
const KO_XP = 40;
const PLAY_XP = 10;
const fr = (n: number) => String(n).replace('.', ',');

/** Ce que la scène montre pendant la mise en scène d'un tour. */
interface Scene {
  revelation: { player: Action; machine: Action; gagnant: Who | null } | null;
  bandeau: { texte: string; cote: Who | null; icone: string | null } | null;
  elan: Who | null;
  effet: { cible: Who; nom: string; cle: number } | null;
  tampon: { cible: Who; texte: string } | null;
  degats: { cible: Who; montant: number; cle: number } | null;
  gardes: Who[];
  brise: Who | null;
}
const SCENE_VIDE: Scene = { revelation: null, bandeau: null, elan: null, effet: null, tampon: null, degats: null, gardes: [], brise: null };

@Component({
  selector: 'app-arene',
  imports: [RouterLink, EffetSprite, Etiquette],
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
  protected readonly scene = signal<Scene>(SCENE_VIDE);
  /** Dégâts déjà montrés pendant la mise en scène, avant d'appliquer le nouvel état. */
  private readonly encaisse = signal<Record<Who, number>>({ player: 0, machine: 0 });
  protected readonly historique = signal<string[]>([]);
  private vitesse = 1;
  private cle = 0;
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
    const hp = Math.max(0, f.hp - this.encaisse()[who]);
    return {
      f, hp, energy: side.energy, team: side.team,
      vivants: side.team.map((t) => t.hp > 0),
      pips: Array.from({ length: d.rules.maxEnergy }, (_, i) => i < side.energy),
      hpPct: (hp / f.card.hp) * 100,
      ink: typeOf(f.card.types[0]),
      techInk: typeOf(f.card.tech.type),
      sprite: animated(f.card.id, who === 'player'),
    };
  }

  protected art(card: Card): string { return artwork(card.id); }
  protected ink(card: Card) { return typeOf(card.types[0]); }
  protected alive(f: Fighter): boolean { return f.hp > 0; }

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
    this.historique.set([]);
    this.scene.set(SCENE_VIDE);
    this.duel.set(createDuel(this.myCards(), this.theirCards()));
    this.phase.set('fight');
  }

  protected play(action: Action): void {
    const state = this.duel();
    if (!state || this.busy() || state.winner) return;
    const machine = chooseMachineAction(state, Math.random, this.challenge()?.skill ?? 0.6);
    const before = { player: active(state.player).card, machine: active(state.machine).card };
    const { state: next, report } = resolve(state, action, machine);
    if (report.scorer) this.kos[report.scorer] = (this.kos[report.scorer] ?? 0) + 1;
    this.busy.set(true);
    this.vitesse = 1;
    void this.mettreEnScene(state.turn, before, next, report);
  }

  /** Un clic sur la scène accélère la mise en scène en cours. */
  protected accelerer(): void {
    if (this.busy()) this.vitesse = 0.15;
  }

  private attendre(ms: number): Promise<void> {
    return new Promise((ok) => setTimeout(ok, ms * this.vitesse));
  }

  private maj(p: Partial<Scene>): void {
    this.scene.update((s) => ({ ...s, ...p }));
  }

  /** Révélation des deux gestes, puis pour chaque coup : bandeau, élan, effet, tampon et dégâts. */
  private async mettreEnScene(manche: number, before: Record<Who, Card>, next: DuelState, report: TurnReport): Promise<void> {
    const reduit = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seq = sequence(report);
    const gardes = (['player', 'machine'] as Who[]).filter((w) => report[w] === 'garde');
    this.maj({ gardes });
    if (!reduit) {
      this.maj({ revelation: { player: report.player, machine: report.machine, gagnant: seq.gagnant } });
      await this.attendre(1000);
    }
    const lignes: string[] = [];
    for (const c of seq.coups) {
      const carte = before[c.attaquant];
      const tech = c.action === 'tech' ? typeOf(carte.tech.type) : null;
      this.maj({ revelation: null, bandeau: { texte: tech ? `${carte.name} lance ${carte.tech.name} !` : `${carte.name} frappe !`, cote: c.attaquant, icone: tech?.icon ?? null } });
      await this.attendre(reduit ? 900 : 700);
      this.maj({ bandeau: reduit ? this.scene().bandeau : null, elan: reduit ? null : c.attaquant, effet: reduit ? null : { cible: c.cible, nom: tech?.key ?? 'impact', cle: ++this.cle } });
      await this.attendre(260);
      if (c.tampon) this.maj({ tampon: { cible: c.cible, texte: c.tampon }, brise: c.tampon === 'GARDE PERCÉE !' ? c.cible : null });
      if (c.degats > 0) {
        this.encaisse.update((e) => ({ ...e, [c.cible]: e[c.cible] + c.degats }));
        this.maj({ degats: { cible: c.cible, montant: c.degats, cle: ++this.cle } });
      }
      await this.attendre(900);
      this.maj({ elan: null, effet: null, tampon: null, degats: null, bandeau: null });
      const geste = tech ? `${carte.tech.name}${c.efficacite !== 1 ? ' ×' + fr(c.efficacite) : ''}` : 'Frappe';
      lignes.push(`${carte.name} · ${geste} · ${c.degats > 0 ? '−' + c.degats + ' PV' : c.tampon === 'PARÉ !' ? 'paré' : 'sans effet'}`);
    }
    if (seq.note) {
      this.maj({ bandeau: { texte: seq.note, cote: null, icone: null } });
      await this.attendre(900);
      lignes.push('Deux Gardes · on recharge');
    }
    if (report.koMachine) lignes.push(`${before.machine.name} K.O.`);
    if (report.koPlayer) lignes.push(`${before.player.name} K.O.`);
    this.historique.update((h) => [`Manche ${manche} : ${lignes.join(' ; ')}`, ...h].slice(0, 6));
    this.scene.set(SCENE_VIDE);
    this.encaisse.set({ player: 0, machine: 0 });
    this.duel.set(next);
    this.report.set(report);
    this.busy.set(false);
    if (next.winner) this.finish(next.winner === 'player');
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
