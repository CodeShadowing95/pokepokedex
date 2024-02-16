import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {
  @Output() test: EventEmitter<string> = new EventEmitter<string>();
  toggleDialog(name: string) {
    this.test.emit(name);
  }
}
