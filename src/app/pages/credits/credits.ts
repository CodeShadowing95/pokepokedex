import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GYMS } from '../../core/game/campaign';
import { artwork } from '../../core/pokemon';

/**
 * Page « Crédits » : l'histoire du projet, racontée comme un générique.
 * Chaque bloc marqué `.reveler` apparaît quand il entre dans l'écran.
 */
@Component({
  selector: 'app-credits',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './credits.html',
  styleUrl: './credits.css',
})
export class Credits {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly gyms = GYMS.length * GYMS[0].length;
  /** Les trois premiers compagnons, alignés à la toute fin. */
  protected readonly trio = [1, 4, 7].map((id) => artwork(id));
  /** Une silhouette par région : le premier starter de chacune. */
  protected readonly lignee = [1, 152, 252, 387, 495, 650, 722, 810, 906].map((id) => artwork(id));

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const blocs = this.host.nativeElement.querySelectorAll('.reveler');
      const observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('vu');
              observer.unobserve(e.target);
            }
          }
        },
        { threshold: 0.25 },
      );
      blocs.forEach((b) => observer.observe(b));
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
