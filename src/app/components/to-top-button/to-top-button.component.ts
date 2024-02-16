import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-to-top-button',
  templateUrl: './to-top-button.component.html',
  styleUrl: './to-top-button.component.css'
})
export class ToTopButtonComponent implements OnInit {
  showButton: boolean = false;

  ngOnInit(): void {
    this.onScroll();
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    /* The line `this.showButton = window.scrollY > window.innerHeight / 2;` is checking if the user
    has scrolled more than half of the window's height. If the condition is true, it sets the
    `showButton` property to `true`, indicating that the "to top" button should be shown. Otherwise,
    it sets `showButton` to `false`, indicating that the button should be hidden. */
    this.showButton = window.scrollY > window.innerHeight / 2;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
