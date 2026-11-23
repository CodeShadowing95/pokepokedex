import { Son } from '../../ui/son';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { AudioService } from '../../core/audio.service';
import { RouterLink } from '@angular/router';
import { GYMS, LEAGUE, gymTeam, rivalTeam } from '../../core/game/campaign';
import { Card, cardOf, moveOf, total } from '../../core/game/cards';
import { PART_BANC, avancee, evolutionAuNiveau, experienceGagnee, nouvellesCapacites } from '../../core/game/progression';
import { ApresDuel, Evenement } from '../../ui/apres-duel';
import { DuelState, Fighter, PASSE, STRUGGLE, TurnReport, Who, active, chooseMachineMove, createDuel, resolve, usable } from '../../core/game/duel';
import { capturable, lancer } from '../../core/game/capture';
import { PlayerStore } from '../../core/player.store';
import { PokedexService } from '../../core/pokedex.service';
import { animated, artwork, cry } from '../../core/pokemon';
import { REGIONS, typeOf } from '../../core/types';
import { tampon } from '../../core/game/sequence';
import { EffetSprite } from '../../ui/effet-sprite';
import { Etiquette } from '../../ui/etiquette';
import { DRESSEUR_PAR_TYPE } from '../../core/avatars';
import { dresseurImg } from '../../core/dresseurs';

type Phase = 'prep' | 'fight' | 'end';

/** Ce que la scène montre pendant la mise en scène d'un tour. */
interface Scene {
  bandeau: { texte: string; cote: Who | null; icone: string | null } | null;
  elan: Who | null;
  effet: { cible: Who; nom: string; cle: number } | null;
  tampon: { cible: Who; texte: string } | null;
  degats: { cible: Who; montant: number; cle: number } | null;
  /** Les dresseurs en scène au début du duel : ils entrent, puis sortent après avoir envoyé leur Pokémon. */
  dresseurs: Record<Who, 'entre' | 'lance' | null>;
  /** La Pokéball qu'un dresseur vient de lancer pour envoyer son Pokémon (clé d'animation). */
  envoi: Record<Who, number | null>;
  /** Le Pokémon qui sort de sa balle (clé d'animation). */
  apparu: Record<Who, number | null>;
  /** Pokémon qui s'effondrent, K.O. */
  ko: Who[];
  /** Le Pokémon sauvage est chromatique : il scintille en apparaissant. */
  brille: boolean;
  /** Pokémon pas encore envoyés. */
  caches: Who[];
  /** La Pokéball lancée sur le Pokémon sauvage, étape par étape. */
  balle: { etat: EtatBalle; cle: number } | null;
}
type EtatBalle = 'vol' | 'aspire' | 'sol' | 'secousse' | 'tenue' | 'ouverte';
const PERSONNE = { player: null, machine: null };
/** Ce qu'un Pokémon de l'équipe a gagné pendant le duel. */
interface Gain { name: string; xp: number; avant: number; apres: number; appris: string[]; pct: number }
const SCENE_VIDE: Scene = { bandeau: null, elan: null, effet: null, tampon: null, degats: null, dresseurs: PERSONNE, caches: [], balle: null, envoi: PERSONNE, apparu: PERSONNE, ko: [], brille: false };
/** Les phrases des jeux quand le Pokémon se libère, selon le nombre de secousses. */
const LIBERE = ['Oh non ! Le Pokémon s’est libéré !', 'Raah ! Ça y était presque !', 'Aaaah ! Presque !', 'Mince ! Ça y était presque !'];
/** Taux de capture par défaut, le temps que les fiches détaillées arrivent (celui des starters). */
const TAUX_DEFAUT = 45;

@Component({
  selector: 'app-arene',
  imports: [Son, ApresDuel, RouterLink, EffetSprite, Etiquette],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './arene.html',
  styleUrls: ['./arene.css', './intro.css', './capture.css'],
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
  protected readonly gains = signal<Gain[]>([]);
  /** Ce qui suit le duel, une étape à la fois : capacités à apprendre, évolutions. */
  protected readonly evenements = signal<Evenement[]>([]);
  /** Expérience gagnée pendant le duel, par carte. */
  private xpGagnee: Record<number, number> = {};
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
      return p ? [cardOf(p, owned[id]?.level, owned[id]?.moves)] : [];
    });
  });

  protected readonly theirCards = computed(() => {
    const all = this.dex.all();
    const mine = this.myCards();
    if (!all.length || !mine.length) return [];
    const w = this.wild();
    if (w) return [cardOf(w, this.niveauSauvage())];
    const c = this.challenge();
    if (c) return gymTeam(all, c.region, c.gym);
    this.rivalSeed();
    const average = mine.reduce((sum, card) => sum + total(this.dex.get(card.id)!), 0) / mine.length;
    return (this.rival ??= rivalTeam(all, average, Math.random, this.player.niveauEquipe()));
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
      sprite: animated(f.card.id, who === 'player', who === 'player' ? !!this.player.owned()[f.card.id]?.shiny : !!this.wild() && this.chroma() === '1'),
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
    this.xpGagnee = {};
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

  /**
   * Entrée en scène, comme dans les jeux : les dresseurs glissent jusqu'à leur place, puis chacun
   * annonce son Pokémon, repart en lançant sa Pokéball, et le Pokémon sort de la balle.
   * Face à un Pokémon sauvage, il est déjà là : seul ton dresseur entre.
   */
  private async entree(): Promise<void> {
    const d = this.duel()!;
    const eux = this.euxDresseur();
    const sauvage = active(d.machine).card;
    if (this.wild()) {
      const brille = this.chroma() === '1';
      this.scene.set({ ...SCENE_VIDE, dresseurs: { player: 'entre', machine: null }, caches: ['player'], apparu: { player: null, machine: ++this.cle }, brille,
        bandeau: { texte: `Un ${sauvage.name} sauvage apparaît !${brille ? ' Il brille !' : ''}`, cote: 'machine', icone: null } });
      this.cri(sauvage.id);
      await this.attendre(1800);
      this.maj({ bandeau: null, brille: false });
    } else {
      this.scene.set({ ...SCENE_VIDE, dresseurs: { player: 'entre', machine: 'entre' }, caches: ['player', 'machine'] });
      await this.attendre(1000);
      this.maj({ bandeau: { texte: `${eux.nom} veut se battre !`, cote: 'machine', icone: null } });
      await this.attendre(1300);
      await this.envoyer('machine', `${eux.nom} envoie ${sauvage.name} !`);
    }
    await this.envoyer('player', `Vas-y, ${active(d.player).card.name} !`);
    this.scene.set(SCENE_VIDE);
    this.busy.set(false);
  }

  /** Un dresseur annonce son Pokémon, lance la balle (bruit de lancer), et le Pokémon en sort (bruit de sortie, puis son cri). */
  private async envoyer(who: Who, annonce: string): Promise<void> {
    const carte = active(this.duel()![who]).card;
    const present = this.scene().dresseurs[who] === 'entre';
    this.maj({ bandeau: { texte: annonce, cote: who, icone: null } });
    await this.attendre(1000);
    this.audio.effet('lancer');
    this.maj({ bandeau: null, dresseurs: { ...this.scene().dresseurs, [who]: present ? 'lance' : null }, envoi: { ...this.scene().envoi, [who]: ++this.cle } });
    await this.attendre(560);
    this.audio.effet('sortie');
    this.maj({ caches: this.scene().caches.filter((w) => w !== who), apparu: { ...this.scene().apparu, [who]: ++this.cle } });
    await this.attendre(420);
    this.cri(carte.id);
    await this.attendre(650);
    this.maj({ envoi: { ...this.scene().envoi, [who]: null }, apparu: { ...this.scene().apparu, [who]: null }, dresseurs: { ...this.scene().dresseurs, [who]: null } });
  }

  private cri(id: number): void {
    this.audio.cri(cry(id));
  }

  /** `choice` : indice de la capacité, ou STRUGGLE quand il ne reste plus de PP. */
  protected play(choice: number): void {
    const state = this.duel();
    if (!state || this.busy() || state.winner) return;
    const machine = chooseMachineMove(state, Math.random, this.challenge()?.skill ?? 0.6);
    const before = { player: active(state.player).card, machine: active(state.machine).card };
    const { state: next, report } = resolve(state, choice, machine);
    if (report.koMachine) this.partagerXp(before.machine, state);
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
    // K.O. : le Pokémon s'effondre, puis son dresseur envoie le suivant.
    const tombes = (['machine', 'player'] as Who[]).filter((w) => (w === 'machine' ? report.koMachine : report.koPlayer));
    if (tombes.length) {
      this.maj({ ko: tombes, bandeau: { texte: `${before[tombes[0]].name} est K.O. !`, cote: tombes[0], icone: null } });
      await this.attendre(1300);
    }
    const remplaces = next.winner ? [] : tombes;
    this.scene.set({ ...SCENE_VIDE, caches: remplaces });
    this.encaisse.set({ player: 0, machine: 0 });
    this.duel.set(next);
    this.report.set(report);
    for (const w of remplaces) {
      const nom = active(next[w]).card.name;
      await this.envoyer(w, w === 'machine' ? `${this.euxDresseur().nom} envoie ${nom} !` : `À toi, ${nom} !`);
    }
    this.scene.set(SCENE_VIDE);
    this.busy.set(false);
    if (next.winner) this.finish(next.winner === 'player');
  }

  /** Les Pokémon sauvages ont un ou deux niveaux de moins que ton équipe. */
  private niveauSauvage(): number {
    return Math.max(2, this.player.niveauEquipe() - 1);
  }

  /**
   * Un adversaire est vaincu (ou capturé) : l'expérience des jeux va au Pokémon qui combat,
   * la moitié aux autres membres de l'équipe encore debout (Multi Exp.).
   */
  private partagerXp(vaincu: Card, state: DuelState): void {
    const p = this.dex.get(vaincu.id);
    if (!p) return;
    const xp = experienceGagnee(p, vaincu.level, !this.wild());
    const actif = active(state.player).card.id;
    for (const f of state.player.team) {
      if (f.hp <= 0 && f.card.id !== actif) continue;
      const part = f.card.id === actif ? xp : Math.floor(xp * PART_BANC);
      this.xpGagnee[f.card.id] = (this.xpGagnee[f.card.id] ?? 0) + part;
    }
  }

  /**
   * Fin du duel : l'expérience est versée, puis viennent, comme dans les jeux, les nouvelles capacités
   * (apprises d'office s'il reste une place, sinon le joueur choisit) et les évolutions.
   */
  private verserXp(): void {
    const gains: Gain[] = [];
    const suite: Evenement[] = [];
    for (const card of this.myCards()) {
      const p = this.dex.get(card.id);
      const o = this.player.owned()[card.id];
      if (!p || !o) continue;
      const xp = this.xpGagnee[card.id] ?? 0;
      const connues = card.moves.map((m) => m.id);
      const { avant, apres } = this.player.gainCardXp(card.id, xp, p.growth, connues);
      const appris: string[] = [];
      let actuelles = [...(this.player.owned()[card.id]?.moves ?? connues)];
      for (const id of nouvellesCapacites(p, avant, apres, actuelles)) {
        if (actuelles.length < 4) {
          this.player.apprendre(card.id, id, actuelles);
          actuelles = [...actuelles, id];
          appris.push(moveOf(id).nom);
        } else suite.push({ type: 'apprendre', id: card.id, nom: card.name, capacite: id });
      }
      const evo = apres > avant ? evolutionAuNiveau(this.dex.evolutions(card.id), apres) : null;
      if (evo) suite.push({ type: 'evolution', de: p, vers: evo });
      const o2 = this.player.owned()[card.id];
      gains.push({ name: card.name, xp, avant, apres, appris, pct: o2 ? Math.round(avancee(p.growth, o2.level, o2.xp) * 100) : 0 });
    }
    this.gains.set(gains);
    this.evenements.set(suite);
  }

  private finish(won: boolean, capture = false): void {
    const w = this.wild();
    if (capture && w) this.partagerXp(active(this.duel()!.machine).card, this.duel()!);
    this.verserXp();
    this.player.recordDuel(won);
    const c = this.challenge();
    if (won && c) this.player.winBadge(c.region, c.gym);
    if (w && capture) {
      const chromatique = this.chroma() === '1';
      this.player.addCard(w.id, chromatique, active(this.duel()!.machine).card.level, w.growth);
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
