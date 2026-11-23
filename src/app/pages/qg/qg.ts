import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { dresseurImg } from '../../core/dresseurs';
import { RouterLink } from '@angular/router';
import { GYMS } from '../../core/game/campaign';
import { PlayerStore, Pull, dailyNumber, dayKey } from '../../core/player.store';
import { PokedexService } from '../../core/pokedex.service';
import { Pokemon, artwork, cry, normalize } from '../../core/pokemon';
import { REGIONS, typeOf } from '../../core/types';

interface CryRound { answer: Pokemon; choices: Pokemon[]; picked: number }

@Component({
  selector: 'app-qg',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './qg.html',
  styleUrl: './qg.css',
})
export class Qg {
  protected readonly img = dresseurImg;
  private readonly dex = inject(PokedexService);
  protected readonly player = inject(PlayerStore);

  protected readonly dailyType = typeOf(this.player.questType);
  protected readonly quests = computed(() => { this.player.snapshot(); return this.player.quests(this.dailyType.label); });
  protected readonly week = computed(() => Array.from({ length: 7 }, (_, i) => i < Math.min(7, ((this.player.streak() - 1) % 7) + 1)));

  // ---- Booster ----
  protected readonly pulls = signal<(Pull & { art: string; ink: string })[]>([]);
  protected open(): void {
    const pulls = this.player.openBooster(this.dex.all());
    this.pulls.set(pulls.map((p) => ({ ...p, art: artwork(p.pokemon.id, p.shiny), ink: typeOf(p.pokemon.types[0]).color })));
  }

  // ---- Qui est-ce ? ----
  protected readonly guess = signal('');
  protected readonly wrong = signal(false);
  protected readonly mystery = computed(() => {
    const all = this.dex.all();
    if (!all.length) return null;
    const p = all[dailyNumber(dayKey(), 'mystery', all.length)];
    const m = this.player.mystery();
    const over = m.solved || m.tries >= 3;
    const hints = [
      m.tries >= 1 || over ? 'Type : ' + p.types.map((t) => typeOf(t).label).join(' et ') : null,
      m.tries >= 2 || over ? `Région : ${REGIONS[p.gen - 1]} · première lettre : ${p.name[0]}` : null,
    ].filter((h): h is string => !!h);
    return { p, art: artwork(p.id), over, solved: m.solved, left: 3 - m.tries, hints };
  });
  protected readonly names = computed(() => this.dex.all().map((p) => p.name));

  protected tryGuess(event: Event): void {
    event.preventDefault();
    const m = this.mystery();
    const value = normalize(this.guess().trim());
    if (!m || m.over || !value) return;
    const correct = value === normalize(m.p.name);
    this.player.guessMystery(correct);
    this.wrong.set(!correct);
    if (correct) this.player.addCard(m.p.id, false);
    this.guess.set('');
  }
  protected typed(event: Event): void { this.guess.set((event.target as HTMLInputElement).value); }

  // ---- Devine le cri ----
  protected readonly round = signal<CryRound | null>(null);
  protected readonly score = signal({ good: 0, played: 0 });
  protected newRound(): void {
    const all = this.dex.all();
    if (all.length < 4) return;
    const choices: Pokemon[] = [];
    while (choices.length < 4) {
      const p = all[Math.floor(Math.random() * all.length)];
      if (!choices.includes(p)) choices.push(p);
    }
    this.round.set({ answer: choices[Math.floor(Math.random() * 4)], choices, picked: 0 });
    this.listen();
  }
  protected listen(): void {
    const r = this.round();
    if (!r) return;
    const audio = new Audio(cry(r.answer.id));
    audio.volume = 0.35;
    audio.play().catch(() => undefined);
  }
  protected answer(id: number): void {
    const r = this.round();
    if (!r || r.picked) return;
    this.round.set({ ...r, picked: id });
    this.score.update((s) => ({ good: s.good + Number(id === r.answer.id), played: s.played + 1 }));
  }
  protected art(p: Pokemon): string { return artwork(p.id); }

  // ---- Badges ----
  protected readonly badges = computed(() => {
    const won = this.player.snapshot().badges;
    return REGIONS.map((name, i) => ({ name, list: GYMS[i].map((g, n) => ({ label: g.badge, color: typeOf(g.type).color, has: (won[i + 1] ?? 0) > n })) })).filter((r, i) => i === 0 || r.list.some((b) => b.has));
  });

  protected reset(): void {
    if (confirm('Effacer toute ta progression sur cet appareil ?')) {
      this.player.reset();
      this.pulls.set([]);
    }
  }
}
