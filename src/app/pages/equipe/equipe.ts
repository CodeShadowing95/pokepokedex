import { Son } from '../../ui/son';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { cardOf } from '../../core/game/cards';
import { PlayerStore } from '../../core/player.store';
import { PokedexService } from '../../core/pokedex.service';
import { artwork } from '../../core/pokemon';
import { TYPES, effectiveness, typeOf } from '../../core/types';

@Component({
  selector: 'app-equipe',
  imports: [Son, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './equipe.html',
  styleUrl: './equipe.css',
})
export class Equipe {
  private readonly dex = inject(PokedexService);
  protected readonly player = inject(PlayerStore);

  protected readonly pool = computed(() => {
    const owned = this.player.owned();
    const deck = this.player.deck();
    return Object.keys(owned).flatMap((key) => {
      const p = this.dex.get(+key);
      return p ? [{ p, card: cardOf(p, owned[+key].level, owned[+key].moves), ink: typeOf(p.types[0]), art: artwork(p.id, owned[+key].shiny), picked: deck.includes(p.id) }] : [];
    });
  });
  protected readonly team = computed(() => this.player.deck().flatMap((id) => this.pool().filter((c) => c.p.id === id)));
  protected readonly slots = computed(() => [0, 1, 2].map((i) => this.team()[i]));

  /** Pour chaque type attaquant : combien de mes cartes le craignent, combien lui résistent, et si une de mes techniques le bat. */
  protected readonly coverage = computed(() => {
    const team = this.team();
    return TYPES.map((type) => ({
      type,
      weak: team.filter((c) => effectiveness(type.id, c.p.types) > 1).length,
      resist: team.filter((c) => effectiveness(type.id, c.p.types) < 1).length,
      hit: team.some((c) => c.card.moves.some((m) => effectiveness(m.type, [type.id]) > 1)),
    }));
  });
  protected readonly verdict = computed(() => {
    const team = this.team(), cov = this.coverage();
    if (team.length < 3) return { tone: 'neutre', text: `Il manque ${3 - team.length} carte${team.length < 2 ? 's' : ''} pour former l’équipe.` };
    const holes = cov.filter((c) => c.weak >= 2);
    const reach = cov.filter((c) => c.hit).length;
    if (holes.length) return { tone: 'alerte', text: `Attention : ${holes.map((h) => h.type.label).join(', ')} menace au moins deux de tes cartes.` };
    if (reach < 5) return { tone: 'neutre', text: `Défense correcte, mais tes techniques ne battent que ${reach} types sur 18. Varie les types.` };
    return { tone: 'solide', text: `Équipe solide : aucun type n’en menace deux à la fois, et tes techniques battent ${reach} types.` };
  });

  protected toggle(id: number): void {
    const deck = this.player.deck();
    if (deck.includes(id)) this.player.setDeck(deck.filter((d) => d !== id));
    else if (deck.length < 3) this.player.setDeck([...deck, id]);
  }
}
