import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-hint',
  templateUrl: './hint.component.html',
  styleUrl: './hint.component.css'
})
export class HintComponent {
  @Output() openDialog: EventEmitter<string> = new EventEmitter<string>();

  buttonClick() {
    this.openDialog.emit("test");
  }
}
