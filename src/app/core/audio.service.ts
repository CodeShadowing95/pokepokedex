import { Injectable, signal } from '@angular/core';

/** Les musiques du dossier public/soundtracks (noms de fichiers tels que déposés). */
export const PISTES = {
  opening: '1-01. Opening.mp3',
  sauvage: '1-07. Battle (VS Wild Pokémon).mp3',
  'victoire-sauvage': '1-08. Victory (VS Wild Pokémon).mp3',
  dresseur: '1-15. Battle (VS Trainer).mp3',
  'victoire-dresseur': '1-16. Victory (VS Trainer).mp3',
  champion: '1-28. Battle (VS Gym Leader).mp3',
  'victoire-champion': '1-29. Victory (VS Gym Leader).mp3',
} as const;
export type Piste = keyof typeof PISTES;

const EFFETS = {
  exclamation: 'pokemon-exclamation-mark-sound-effect.mp3',
  lancer: 'pokeball-throw.mp3',
  rappel: 'in-battle-recall-switch-pokeball.mp3',
  atterrir: 'pokeball-land.mp3',
  secousse: 'pokeball-wobble.mp3',
  capture: 'pokeball-caught.wav',
  selection: 'select-options-audio.wav',
  confirmation: 'confirm-button-audio.wav',
  sortie: 'pokemon-out-audio.wav',
} as const;
export type Effet = keyof typeof EFFETS;
const CLE = 'pokedex.son';
const CLE_BRUITAGES = 'pokedex.bruitages';
const VOLUME = 0.45;
const FONDU = 700;

export const urlSon = (fichier: string) => 'soundtracks/' + encodeURIComponent(fichier);

/**
 * La musique du site. Active par défaut, mais les navigateurs interdisent tout son avant le premier
 * geste du visiteur : la musique attend donc son premier clic (ou sa première touche) pour démarrer.
 * Les pages disent seulement quelle piste convient à la scène (`jouer`) ; le service s'occupe
 * du fondu entre deux pistes et se souvient du choix du visiteur.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  /** La musique de fond. */
  readonly actif = signal(this.lire(CLE));
  /** Les effets sonores : boutons, Pokéball, exclamation. Réglés à part de la musique. */
  readonly bruitages = signal(this.lire(CLE_BRUITAGES));
  /** La piste que la scène demande, jouée ou non selon `actif`. */
  private voulue: Piste | null = 'opening';
  private courante: { piste: Piste; el: HTMLAudioElement } | null = null;

  private lire(cle: string): boolean {
    try { return localStorage.getItem(cle) !== '0'; } catch { return true; }
  }

  private retenir(cle: string, on: boolean): void {
    try { localStorage.setItem(cle, on ? '1' : '0'); } catch { /* navigation privée */ }
  }

  basculer(): void {
    const on = !this.actif();
    this.actif.set(on);
    this.retenir(CLE, on);
    if (on) this.appliquer();
    else this.arreter();
  }

  basculerBruitages(): void {
    const on = !this.bruitages();
    this.bruitages.set(on);
    this.retenir(CLE_BRUITAGES, on);
  }

  /** La scène demande une piste. Les victoires ne bouclent pas. */
  jouer(piste: Piste): void {
    this.voulue = piste;
    if (this.actif()) this.appliquer();
  }

  /** Fin de scène sans musique (une défaite) : la piste s'éteint doucement. */
  silence(): void {
    this.voulue = null;
    this.arreter();
  }

  effet(nom: Effet): void {
    if (!this.bruitages() || typeof Audio === 'undefined') return;
    const el = new Audio(urlSon(EFFETS[nom]));
    el.volume = nom === 'selection' || nom === 'confirmation' ? 0.5 : 0.8;
    void el.play().catch(() => undefined);
  }

  /** Le cri d'un Pokémon (fichier distant de PokéAPI), joué avec les effets sonores. */
  cri(url: string): void {
    if (!this.bruitages() || typeof Audio === 'undefined') return;
    const el = new Audio(url);
    el.volume = 0.35;
    void el.play().catch(() => undefined);
  }

  /** Charge les bruitages d'une scène à l'avance, pour qu'ils tombent pile au bon moment. */
  precharger(...noms: Effet[]): void {
    if (!this.bruitages() || typeof Audio === 'undefined') return;
    for (const n of noms) { const el = new Audio(urlSon(EFFETS[n])); el.preload = 'auto'; }
  }

  private appliquer(): void {
    const piste = this.voulue;
    if (!piste || typeof Audio === 'undefined') return this.arreter();
    if (this.courante?.piste === piste) return;
    this.arreter();
    const el = new Audio(urlSon(PISTES[piste]));
    el.loop = !piste.startsWith('victoire');
    el.volume = 0;
    this.courante = { piste, el };
    this.lancer(el);
  }

  /**
   * Lance la lecture. Si le navigateur la refuse parce que le visiteur n'a encore rien touché,
   * on réessaie à son premier clic ou à sa première touche.
   */
  private lancer(el: HTMLAudioElement): void {
    el.play().then(() => this.fondu(el, VOLUME)).catch(() => {
      if (typeof document === 'undefined') return;
      const reprise = () => {
        document.removeEventListener('pointerdown', reprise, true);
        document.removeEventListener('keydown', reprise, true);
        if (this.courante?.el === el && this.actif()) void el.play().then(() => this.fondu(el, VOLUME)).catch(() => undefined);
      };
      document.addEventListener('pointerdown', reprise, true);
      document.addEventListener('keydown', reprise, true);
    });
  }

  private arreter(): void {
    const c = this.courante;
    this.courante = null;
    if (c) this.fondu(c.el, 0, () => c.el.pause());
  }

  /** Fondu par petits pas de minuterie : contrairement à requestAnimationFrame, il avance aussi onglet caché. */
  private fondu(el: HTMLAudioElement, cible: number, fin?: () => void): void {
    const depart = el.volume, t0 = Date.now();
    const pas = () => {
      const k = Math.min(1, (Date.now() - t0) / FONDU);
      el.volume = Math.min(1, Math.max(0, depart + (cible - depart) * k));
      if (k < 1) setTimeout(pas, 40);
      else fin?.();
    };
    pas();
  }
}
