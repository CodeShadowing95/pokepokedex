import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent implements OnInit {
  dialogOpen: boolean = false;
  @Output() newOutput: EventEmitter<string> = new EventEmitter<string>();
  test: string = '';

  ngOnInit(): void {
    this.toggleDialog(this.test);
  }

  toggleDialog(name: string) {
    this.dialogOpen = !this.dialogOpen;
    this.test = name;
    this.newOutput.emit(this.test);
  }
}
