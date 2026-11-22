import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { typeOf } from '../core/types';

/** Pastille d'un type. La couleur d'un type ne sert qu'à dire ce type (règle de la charte). */
@Component({
  selector: 'app-type-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="chip" [style.background]="info().color" [style.color]="info().text">{{ info().label }}</span>`,
})
export class TypeChip {
  readonly type = input.required<number>();
  protected readonly info = computed(() => typeOf(this.type()));
}
