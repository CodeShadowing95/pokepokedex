import { Injectable, computed, effect, signal } from '@angular/core';
import { Pokemon } from './pokemon';
import { total } from './game/cards';

export interface OwnedCard {
  xp: number;
  level: number;
  shiny: boolean;
  count: number;
}

export interface PlayerState {
  starter: number;
  owned: Record<number, OwnedCard>;
  seen: number[];
  deck: number[];
  dust: number;
  xp: number;
  wins: number;
  streak: { count: number; last: string; jokerWeek: string };
  boosterDay: string;
  quests: { day: string; progress: Record<string, number> };
  mystery: { day: string; tries: number; solved: boolean };
  /** Nombre d'arènes gagnées, par région (1 = Kanto). */
  badges: Record<number, number>;
  /** Le dresseur choisi à l'accueil : son prénom et son avatar (clé de core/dresseurs.ts). */
  dresseur: { nom: string; avatar: string } | null;
  /** Vrai quand le visiteur a choisi d'explorer sans passer par l'accueil. */
  accueilPasse: boolean;
  /** Rencontres sauvages du jour, pour en limiter le nombre. */
  sauvages: { day: string; count: number };
}

export interface Quest {
  id: 'wins' | 'view' | 'mystery';
  label: string;
  goal: number;
  reward: string;
  progress: number;
  done: boolean;
}

export interface Pull {
  pokemon: Pokemon;
  shiny: boolean;
  isNew: boolean;
  rarity: string;
}

const KEY = 'pokedex.player.v1';
const EMPTY: PlayerState = {
  starter: 0, owned: {}, seen: [], deck: [], dust: 0, xp: 0, wins: 0,
  streak: { count: 0, last: '', jokerWeek: '' },
  boosterDay: '', quests: { day: '', progress: {} }, mystery: { day: '', tries: 0, solved: false }, badges: {},
  dresseur: null, accueilPasse: false, sauvages: { day: '', count: 0 },
};

export const CARD_XP_PER_LEVEL = 100;
export const DUPLICATE_DUST = 20;
export const CRAFT_COST = 100;

/** Date locale au format AAAA-MM-JJ. */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const weekKey = (d = new Date()) => {
  const start = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-${Math.floor((d.getTime() - start.getTime()) / 604_800_000)}`;
};
/** Nombre pseudo-aléatoire stable pour un jour donné : tout le monde a le même mystère du jour. */
export function dailyNumber(day: string, salt: string, max: number): number {
  let h = 2166136261;
  for (const ch of day + salt) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) % max;
}

export function rarityOf(p: Pokemon): string {
  if (p.rank > 0) return 'Légendaire';
  const t = total(p);
  return t >= 500 ? 'Rare' : t >= 400 ? 'Peu commune' : 'Commune';
}

/**
 * Progression du joueur : collection, série, quêtes, poussière.
 * Tout vit dans un signal unique, recopié dans le navigateur (localStorage) à chaque changement.
 * Pas de compte ni de serveur : on joue dès la première seconde.
 */
@Injectable({ providedIn: 'root' })
export class PlayerStore {
  private readonly state = signal<PlayerState>(this.read());

  readonly snapshot = this.state.asReadonly();
  readonly starter = computed(() => this.state().starter);
  readonly dresseur = computed(() => this.state().dresseur);
  /** Premier passage : ni dresseur, ni Pokémon de départ, et l'accueil n'a pas été passé. */
  readonly nouveau = computed(() => !this.state().dresseur && !this.state().starter && !this.state().accueilPasse);
  readonly owned = computed(() => this.state().owned);
  readonly ownedCount = computed(() => Object.keys(this.state().owned).length);
  readonly seenCount = computed(() => this.state().seen.length);
  readonly dust = computed(() => this.state().dust);
  readonly level = computed(() => Math.floor(this.state().xp / 200) + 1);
  readonly levelProgress = computed(() => (this.state().xp % 200) / 2);
  readonly streak = computed(() => this.state().streak.count);
  readonly boosterReady = computed(() => this.state().boosterDay !== dayKey());
  readonly deck = computed(() => this.state().deck.filter((id) => this.state().owned[id]));

  constructor() {
    effect(() => {
      try { localStorage.setItem(KEY, JSON.stringify(this.state())); } catch { /* navigation privée : on joue sans sauvegarde */ }
    });
    this.touchStreak();
  }

  private read(): PlayerState {
    try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return EMPTY; }
  }

  private patch(change: (s: PlayerState) => Partial<PlayerState>): void {
    this.state.update((s) => ({ ...s, ...change(s) }));
  }

  isOwned(id: number): boolean { return !!this.state().owned[id]; }
  isSeen(id: number): boolean { return this.state().seen.includes(id) || this.isOwned(id); }

  setDresseur(nom: string, avatar: string): void {
    this.patch(() => ({ dresseur: { nom: nom.trim().slice(0, 12), avatar } }));
  }

  passerAccueil(): void { this.patch(() => ({ accueilPasse: true })); }

  /** Nombre de rencontres sauvages déjà faites aujourd'hui. */
  rencontresDuJour(): number {
    const s = this.state().sauvages;
    return s?.day === dayKey() ? s.count : 0;
  }

  noterRencontre(): void {
    this.patch(() => ({ sauvages: { day: dayKey(), count: this.rencontresDuJour() + 1 } }));
  }

  /** Niveau moyen des cartes de l'équipe : les Pokémon sauvages s'y alignent. */
  niveauEquipe(): number {
    const owned = this.state().owned, deck = this.deck();
    if (!deck.length) return 1;
    return Math.max(1, Math.round(deck.reduce((s, id) => s + (owned[id]?.level ?? 1), 0) / deck.length));
  }

  chooseStarter(id: number): void {
    this.patch((s) => ({ starter: id, deck: s.deck.includes(id) ? s.deck : [id, ...s.deck].slice(0, 3) }));
    this.addCard(id, false);
  }

  markSeen(p: Pokemon, questType: number): void {
    if (!this.state().seen.includes(p.id)) this.patch((s) => ({ seen: [...s.seen, p.id] }));
    if (p.types.includes(questType)) this.bumpQuest('view:' + p.id, 'view');
  }

  /** Ajoute une carte. Un doublon devient de la poussière. Renvoie vrai si la carte est nouvelle. */
  addCard(id: number, shiny: boolean): boolean {
    const had = this.state().owned[id];
    this.patch((s) => ({
      owned: { ...s.owned, [id]: had ? { ...had, count: had.count + 1, shiny: had.shiny || shiny } : { xp: 0, level: 1, shiny, count: 1 } },
      dust: s.dust + (had ? DUPLICATE_DUST : 0),
      seen: s.seen.includes(id) ? s.seen : [...s.seen, id],
    }));
    return !had;
  }

  craft(id: number): boolean {
    if (this.state().dust < CRAFT_COST || this.isOwned(id)) return false;
    this.patch((s) => ({ dust: s.dust - CRAFT_COST }));
    return this.addCard(id, false);
  }

  setDeck(ids: number[]): void { this.patch(() => ({ deck: ids.slice(0, 3) })); }

  gainCardXp(id: number, amount: number): void {
    const card = this.state().owned[id];
    if (!card) return;
    const xp = card.xp + amount;
    this.patch((s) => ({ owned: { ...s.owned, [id]: { ...card, xp: xp % CARD_XP_PER_LEVEL, level: card.level + Math.floor(xp / CARD_XP_PER_LEVEL) } } }));
  }

  /** Remplace une carte par son évolution, en gardant son niveau. */
  evolve(from: number, to: number): void {
    const card = this.state().owned[from];
    if (!card) return;
    this.patch((s) => {
      const { [from]: _, ...rest } = s.owned;
      return {
        owned: { ...rest, [to]: { ...card, xp: 0 } },
        deck: s.deck.map((id) => (id === from ? to : id)),
        starter: s.starter === from ? to : s.starter,
        seen: s.seen.includes(to) ? s.seen : [...s.seen, to],
      };
    });
  }

  recordDuel(won: boolean): void {
    this.patch((s) => ({ xp: s.xp + (won ? 60 : 15), wins: s.wins + (won ? 1 : 0), dust: s.dust + (won ? 40 : 0) }));
    if (won) this.bumpQuest('win:' + Date.now(), 'wins');
  }

  winBadge(region: number, gym: number): void {
    this.patch((s) => ({ badges: { ...s.badges, [region]: Math.max(s.badges[region] ?? 0, gym) }, xp: s.xp + 120 }));
  }

  // ---- Série de jours ------------------------------------------------------
  private touchStreak(): void {
    const today = dayKey();
    const { last, count, jokerWeek } = this.state().streak;
    if (last === today) return;
    const gap = last ? Math.round((new Date(today).getTime() - new Date(last).getTime()) / 86_400_000) : 0;
    const week = weekKey();
    let next = { count: 1, last: today, jokerWeek };
    if (gap === 1) next = { count: count + 1, last: today, jokerWeek };
    else if (gap === 2 && jokerWeek !== week) next = { count: count + 1, last: today, jokerWeek: week };
    this.patch(() => ({ streak: next }));
  }

  // ---- Booster quotidien ---------------------------------------------------
  openBooster(all: Pokemon[], random: () => number = Math.random): Pull[] {
    if (!this.boosterReady()) return [];
    const tiers: Record<string, Pokemon[]> = { Commune: [], 'Peu commune': [], Rare: [], Légendaire: [] };
    for (const p of all) tiers[rarityOf(p)].push(p);
    const draw = (guaranteed: boolean): Pokemon => {
      const r = random() * 100;
      const tier = r < 1.5 ? 'Légendaire' : r < 11 ? 'Rare' : r < 38 || guaranteed ? 'Peu commune' : 'Commune';
      return tiers[tier][Math.floor(random() * tiers[tier].length)];
    };
    const pulls: Pull[] = [];
    for (let i = 0; i < 5; i++) {
      const pokemon = draw(i === 4);
      const shiny = random() < 1 / 40;
      pulls.push({ pokemon, shiny, isNew: this.addCard(pokemon.id, shiny), rarity: rarityOf(pokemon) });
    }
    this.patch((s) => ({ boosterDay: dayKey(), xp: s.xp + 20 }));
    return pulls;
  }

  // ---- Quêtes du jour ------------------------------------------------------
  /** Type à consulter aujourd'hui (identifiant PokéAPI, 1 à 18). */
  readonly questType = dailyNumber(dayKey(), 'type', 18) + 1;

  quests(typeLabel: string): Quest[] {
    const s = this.state();
    const p = s.quests.day === dayKey() ? s.quests.progress : {};
    const make = (id: Quest['id'], label: string, goal: number, reward: string): Quest => {
      const progress = Math.min(goal, p[id] ?? 0);
      return { id, label, goal, reward, progress, done: progress >= goal };
    };
    return [
      make('wins', 'Gagner 2 duels', 2, '+50 XP'),
      make('view', `Consulter 3 Pokémon ${typeLabel}`, 3, '+30 XP'),
      make('mystery', 'Trouver le Pokémon mystère', 1, '+40 poussière'),
    ];
  }

  private bumpQuest(unique: string, id: Quest['id']): void {
    const goals = { wins: 2, view: 3, mystery: 1 };
    const today = dayKey();
    const current = this.state().quests.day === today ? this.state().quests.progress : {};
    if (current['seen:' + unique] || (current[id] ?? 0) >= goals[id]) return;
    const value = (current[id] ?? 0) + 1;
    this.patch((s) => ({
      quests: { day: today, progress: { ...current, [id]: value, ['seen:' + unique]: 1 } },
      xp: s.xp + (value === goals[id] ? (id === 'wins' ? 50 : id === 'view' ? 30 : 0) : 0),
      dust: s.dust + (value === goals[id] && id === 'mystery' ? 40 : 0),
    }));
  }

  // ---- Qui est-ce ? --------------------------------------------------------
  readonly mystery = computed(() => {
    const m = this.state().mystery;
    return m.day === dayKey() ? m : { day: dayKey(), tries: 0, solved: false };
  });

  guessMystery(correct: boolean): void {
    const m = this.mystery();
    if (m.solved || m.tries >= 3) return;
    this.patch(() => ({ mystery: { day: dayKey(), tries: m.tries + 1, solved: correct } }));
    if (correct) this.bumpQuest('mystery', 'mystery');
  }

  reset(): void { this.state.set(EMPTY); }
}
