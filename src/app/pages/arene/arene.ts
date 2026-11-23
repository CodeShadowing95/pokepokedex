import { Son } from '../../ui/son';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { AudioService } from '../../core/audio.service';
import { RouterLink } from '@angular/router';
import { GYMS, LEAGUE, gymTeam, rivalTeam } from '../../core/game/campaign';
import { Card, cardOf, total } from '../../core/game/cards';
import { DuelState, Fighter, PASSE, STRUGGLE, TurnReport, Who, active, chooseMachineMove, createDuel, resolve, usable } from '../../core/game/duel';
import { capturable, lancer } from '../../core/game/capture';
import { PlayerStore } from '../../core/player.store';
import { PokedexService } from '../../core/pokedex.service';
import { animated, artwork } from '../../core/pokemon';
import { REGIONS, typeOf } from '../../core/types';
import { tampon } from '../../core/game/sequence';
import { EffetSprite } from '../../ui/effet-sprite';
import { Etiquette } from '../../ui/etiquette';
import { DRESSEUR_PAR_TYPE } from '../../core/avatars';
import { dresseurImg } from '../../core/dresseurs';

type Phase = 'prep' | 'fight' | 'end';
const KO_XP = 40;
const PLAY_XP = 10;

/** Ce que la scène montre pendant la mise en scène d'un tour. */
interface Scene {
  bandeau: { texte: string; cote: Who | null; icone: string | null } | null;
  elan: Who | null;
  effet: { cible: Who; nom: string; cle: number } | null;
  tampon: { cible: Who; texte: string } | null;
  degats: { cible: Who; montant: number; cle: number } | null;
  /** Les dresseurs en scène au début du duel : ils entrent, puis sortent après avoir envoyé leur Pokémon. */
  dresseurs: Record<Who, 'entre' | 'sort' | null>;
  /** Pokémon pas encore envoyés. */
  caches: Who[];
  /** La Pokéball lancée sur le Pokémon sauvage, étape par étape. */
  balle: { etat: EtatBalle; cle: number } | null;
}
type EtatBalle = 'vol' | 'aspire' | 'sol' | 'secousse' | 'tenue' | 'ouverte';
const SCENE_VIDE: Scene = { bandeau: null, elan: null, effet: null, tampon: null, degats: null, dresseurs: { player: null, machine: null }, caches: [], balle: null };
/** Les phrases des jeux quand le Pokémon se libère, selon le nombre de secousses. */
const LIBERE = ['Oh non ! Le Pokémon s’est libéré !', 'Raah ! Ça y était presque !', 'Aaaah ! Presque !', 'Mince ! Ça y était presque !'];
/** Taux de capture par défaut, le temps que les fiches détaillées arrivent (celui des starters). */
const TAUX_DEFAUT = 45;

@Component({
  selector: 'app-arene',
  imports: [Son, RouterLink, EffetSprite, Etiquette],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './arene.html',
  styleUrls: ['./arene.css', './capture.css'],
})
export class Arene {
  private readonly dex = inject(PokedexService);
  protected readonly player = inject(PlayerStore);

  /** Présents dans l'adresse quand on vient de la campagne : /arene?region=1&gym=3 */
  readonly region = input<string>();
  readonly gym = input<string>();
  /** Présents après une rencontre sauvage : /arene?sauvage=16&chroma=1 */
  readonly sauvage = input<string>();
  readonly chroma = input<string>();
  private readonly audio = inject(AudioService);
  protected readonly capture = signal<{ nom: string; chromatique: boolean } | null>(null);
  /** Vrai quand un Pokémon sauvage a été mis K.O. au lieu d'être capturé. */
  protected readonly koSauvage = signal(false);
  /** Vrai quand une victoire contre un dresseur a rapporté une Pokéball. */
  protected readonly balleGagnee = signal(false);
  private taux = TAUX_DEFAUT;

  protected readonly phase = signal<Phase>('prep');
  protected readonly duel = signal<DuelState | null>(null);
  protected readonly report = signal<TurnReport | null>(null);
  protected readonly busy = signal(false);
  protected readonly scene = signal<Scene>(SCENE_VIDE);
  /** Dégâts déjà montrés pendant la mise en scène, avant d'appliquer le nouvel état. */
  private readonly encaisse = signal<Record<Who, number>>({ player: 0, machine: 0 });
  private vitesse = 1;
  private cle = 0;
  protected readonly gains = signal<{ name: string; xp: number; level: number; leveled: boolean }[]>([]);
  private kos: Record<number, number> = {};
  private rival: Card[] | null = null;
  private readonly rivalSeed = signal(0);

  protected readonly STRUGGLE = STRUGGLE;
  protected readonly img = dresseurImg;

  /** Ton dresseur, ou un dresseur par défaut si l'accueil a été passé. */
  protected readonly moiDresseur = computed(() => this.player.dresseur() ?? { nom: 'Toi', avatar: 'jeune-pousse' });
  /** Le dresseur d'en face : le champion de l'arène, la Ligue, ou un dresseur de passage en duel libre. */
  protected readonly euxDresseur = computed(() => {
    const c = this.challenge();
    if (c && c.gym !== LEAGUE) {
      const g = GYMS[c.region - 1][c.gym - 1];
      return { nom: g.leader, avatar: DRESSEUR_PAR_TYPE[g.type] };
    }
    if (c) return { nom: 'La Ligue', avatar: 'topdresseur' };
    const pool = Object.values(DRESSEUR_PAR_TYPE);
    return { nom: 'La machine', avatar: pool[this.rivalSeed() % pool.length] };
  });

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

  /** Le Pokémon sauvage à affronter, s'il y en a un. */
  protected readonly wild = computed(() => {
    const id = Number(this.sauvage());
    return id ? (this.dex.get(id) ?? null) : null;
  });

  protected readonly titre = computed(() => this.challenge()?.title ?? (this.wild() ? `${this.wild()!.name} sauvage` : 'Duel libre'));

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
    const w = this.wild();
    if (w) return [cardOf(w, this.player.niveauEquipe())];
    const c = this.challenge();
    if (c) return gymTeam(all, c.region, c.gym);
    this.rivalSeed();
    const average = mine.reduce((sum, card) => sum + total(this.dex.get(card.id)!), 0) / mine.length;
    return (this.rival ??= rivalTeam(all, average));
  });

  protected readonly me = computed(() => this.side('player'));
  protected readonly foe = computed(() => this.side('machine'));
  protected readonly won = computed(() => this.duel()?.winner === 'player' || !!this.capture());
  /** La jauge du Pokémon sauvage est au rouge : le bouton Pokéball apparaît. */
  protected readonly peutCapturer = computed(() => {
    const f = this.foe();
    return !!this.wild() && !!f && capturable(f.hp, f.f.card.hp);
  });

  constructor() {
    // Hors combat, l'arène garde la musique d'ouverture ; une rencontre sauvage démarre tout de suite.
    effect(() => {
      if (this.phase() !== 'prep') return;
      untracked(() => this.audio.jouer('opening'));
      const w = this.wild();
      if (w && this.theirCards().length && this.myCards().length) {
        untracked(() => {
          this.taux = TAUX_DEFAUT;
          void this.dex.details(w.id).then((d) => (this.taux = d?.capture || TAUX_DEFAUT));
          this.audio.precharger('lancer', 'rappel', 'atterrir', 'secousse', 'capture');
          this.start();
        });
      }
    });
  }

  private side(who: Who) {
    const d = this.duel();
    if (!d) return null;
    const side = d[who], f = active(side);
    const hp = Math.max(0, f.hp - this.encaisse()[who]);
    return {
      f, hp, team: side.team,
      vivants: side.team.map((t) => t.hp > 0),
      hpPct: (hp / f.card.hp) * 100,
      ink: typeOf(f.card.types[0]),
      capacites: f.card.moves.map((m, i) => ({ m, i, pp: f.pp[i], ink: typeOf(m.type) })),
      lutte: usable(f).length === 0,
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
    this.scene.set(SCENE_VIDE);
    this.capture.set(null);
    this.koSauvage.set(false);
    this.balleGagnee.set(false);
    this.duel.set(createDuel(this.myCards(), this.theirCards()));
    this.phase.set('fight');
    this.audio.jouer(this.wild() ? 'sauvage' : this.challenge() ? 'champion' : 'dresseur');
    this.busy.set(true);
    this.vitesse = 1;
    void this.entree();
  }

  /** Entrée en scène : les deux dresseurs arrivent, puis chacun envoie son premier Pokémon. */
  private async entree(): Promise<void> {
    const d = this.duel()!;
    const moi = this.moiDresseur(), eux = this.euxDresseur();
    const reduit = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.wild()) {
      // Pas de dresseur en face : le Pokémon sauvage est déjà là.
      this.scene.set({ ...SCENE_VIDE, dresseurs: { player: 'entre', machine: null }, caches: ['player'], bandeau: { texte: `Un ${active(d.machine).card.name} sauvage apparaît !`, cote: 'machine', icone: null } });
      await this.attendre(reduit ? 700 : 1300);
    } else {
      this.scene.set({ ...SCENE_VIDE, dresseurs: { player: 'entre', machine: 'entre' }, caches: ['player', 'machine'], bandeau: { texte: `${eux.nom} veut se battre !`, cote: 'machine', icone: null } });
      await this.attendre(reduit ? 700 : 1200);
      this.maj({ dresseurs: { player: 'entre', machine: 'sort' }, caches: ['player'], bandeau: { texte: `${eux.nom} envoie ${active(d.machine).card.name} !`, cote: 'machine', icone: null } });
      await this.attendre(reduit ? 700 : 1000);
    }
    this.maj({ dresseurs: { player: 'sort', machine: null }, caches: [], bandeau: { texte: `${moi.nom} envoie ${active(d.player).card.name} !`, cote: 'player', icone: null } });
    await this.attendre(reduit ? 700 : 1000);
    this.scene.set(SCENE_VIDE);
    this.busy.set(false);
  }

  /** `choice` : indice de la capacité, ou STRUGGLE quand il ne reste plus de PP. */
  protected play(choice: number): void {
    const state = this.duel();
    if (!state || this.busy() || state.winner) return;
    const machine = chooseMachineMove(state, Math.random, this.challenge()?.skill ?? 0.6);
    const before = { player: active(state.player).card, machine: active(state.machine).card };
    const { state: next, report } = resolve(state, choice, machine);
    if (report.scorer) this.kos[report.scorer] = (this.kos[report.scorer] ?? 0) + 1;
    this.busy.set(true);
    this.vitesse = 1;
    void this.mettreEnScene(before, next, report);
  }

  /**
   * Le lancer de Pokéball, comme dans les jeux : la balle vole, aspire le Pokémon dans un éclair rouge,
   * tombe, tremble jusqu'à trois fois. Capturé : « Gotcha ! ». Libéré : le lancer a pris ton tour,
   * le Pokémon sauvage attaque.
   */
  protected async lancerPokeball(): Promise<void> {
    const state = this.duel();
    if (!state || this.busy() || state.winner || !this.peutCapturer() || !this.player.utiliserPokeball()) return;
    const cible = active(state.machine);
    const resultat = lancer(this.taux, cible.hp, cible.card.hp);
    this.busy.set(true);
    this.vitesse = 1;
    const balle = (etat: EtatBalle, nouvelle = false) => this.maj({ balle: { etat, cle: nouvelle ? ++this.cle : this.cle } });

    this.maj({ bandeau: { texte: `${this.moiDresseur().nom} lance une Pokéball !`, cote: 'player', icone: null } });
    await this.attendre(650);
    this.audio.effet('lancer');
    this.maj({ bandeau: null });
    balle('vol', true);
    await this.attendre(650);
    this.audio.effet('rappel');
    balle('aspire');
    await this.attendre(650);
    balle('sol');
    await this.attendre(380);
    this.audio.effet('atterrir');
    await this.attendre(520);
    for (let i = 0; i < resultat.secousses; i++) {
      this.audio.effet('secousse');
      balle('secousse', true);
      await this.attendre(1000);
    }

    if (resultat.capture) {
      this.audio.effet('capture');
      balle('tenue');
      await this.attendre(1000);
      this.maj({ bandeau: { texte: `Gotcha ! ${cible.card.name} est capturé !`, cote: 'player', icone: null } });
      await this.attendre(1800);
      this.scene.set(SCENE_VIDE);
      this.busy.set(false);
      this.finish(true, true);
      return;
    }

    this.audio.effet('rappel');
    balle('ouverte');
    this.maj({ bandeau: { texte: LIBERE[resultat.secousses], cote: 'machine', icone: null } });
    await this.attendre(1300);
    this.maj({ balle: null, bandeau: null });
    await this.attendre(350);
    // Le lancer a pris le tour du joueur : seul le Pokémon sauvage attaque.
    const machine = chooseMachineMove(state, Math.random, 0.6);
    const before = { player: active(state.player).card, machine: cible.card };
    const { state: next, report } = resolve(state, PASSE, machine);
    void this.mettreEnScene(before, next, report);
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

  /** Pour chaque coup, dans l'ordre : bandeau, élan, effet du type, tampon et dégâts. */
  private async mettreEnScene(before: Record<Who, Card>, next: DuelState, report: TurnReport): Promise<void> {
    const reduit = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const c of report.coups) {
      const ink = typeOf(c.move.type);
      this.maj({ bandeau: { texte: `${before[c.attaquant].name} lance ${c.move.nom} !`, cote: c.attaquant, icone: ink.icon } });
      await this.attendre(reduit ? 900 : 750);
      this.maj({ bandeau: reduit ? this.scene().bandeau : null, elan: reduit ? null : c.attaquant, effet: reduit || !c.touche ? null : { cible: c.cible, nom: ink.key, cle: ++this.cle } });
      await this.attendre(260);
      const texte = tampon(c);
      if (texte) this.maj({ tampon: { cible: c.cible, texte } });
      if (c.degats > 0) {
        this.encaisse.update((e) => ({ ...e, [c.cible]: e[c.cible] + c.degats }));
        this.maj({ degats: { cible: c.cible, montant: c.degats, cle: ++this.cle } });
      }
      await this.attendre(c.touche ? 900 : 700);
      this.maj({ elan: null, effet: null, tampon: null, degats: null, bandeau: null });
    }
    this.scene.set(SCENE_VIDE);
    this.encaisse.set({ player: 0, machine: 0 });
    this.duel.set(next);
    this.report.set(report);
    this.busy.set(false);
    if (next.winner) this.finish(next.winner === 'player');
  }

  private finish(won: boolean, capture = false): void {
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
    const c = this.challenge(), w = this.wild();
    if (won && c) this.player.winBadge(c.region, c.gym);
    if (w && capture) {
      const chromatique = this.chroma() === '1';
      this.player.addCard(w.id, chromatique);
      this.capture.set({ nom: w.name, chromatique });
    } else if (w && won) this.koSauvage.set(true);
    if (won && !w) {
      this.player.gagnerPokeball();
      this.balleGagnee.set(true);
    }
    if (won) this.audio.jouer(w ? 'victoire-sauvage' : c ? 'victoire-champion' : 'victoire-dresseur');
    else this.audio.silence();
    this.phase.set('end');
  }

  protected again(): void {
    this.reroll();
    this.duel.set(null);
    this.phase.set('prep');
  }
}
