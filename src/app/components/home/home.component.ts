import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  isDialogOpen: boolean = false;

  closeDialog(name: string): void {
    this.isDialogOpen = !this.isDialogOpen;
  }

  openDialog(test: string) {
    if(test === 'test') this.isDialogOpen = !this.isDialogOpen;
  }
}
