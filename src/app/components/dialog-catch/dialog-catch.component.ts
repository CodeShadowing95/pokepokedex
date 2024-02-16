import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

const getRandomInteger = (min: number, max: number) => {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

@Component({
  selector: 'app-dialog-catch',
  templateUrl: './dialog-catch.component.html',
  styleUrl: './dialog-catch.component.css'
})
export class DialogCatchComponent {
  @Input() pokemonName!: string;
  @Output() closeModalEvent: EventEmitter<string> = new EventEmitter<string>();
  @Output() msgState: EventEmitter<boolean> = new EventEmitter<boolean>();

  // Useful property to reset the gif image
  @ViewChild('gifImage', { static: false }) gifImage!: ElementRef;

  // Useful to alternate between gif images
  currentImgIndex!: number;

  ngOnInit(): void {
    // Initialize the first gif image
    this.currentImgIndex = -1;
    this.processCatch();
  }

  processCatch() {
    const chance: number = getRandomInteger(0, 10);

    // If chances are odd, Pokemons couldn't be caught
    if(chance % 2 === 1) {
      setTimeout(() => {
        this.currentImgIndex = 1;
        this.reloadGif();
      }, 4150);
      
      setTimeout(() => {
        this.currentImgIndex = 0;
        this.closeModal(0);
        this.reloadGif();
      }, 9500);
    } else {
    // If chances are even, Pokemons could be caught
      setTimeout(() => {
        this.currentImgIndex = 1;
        this.closeModal(1);
        this.reloadGif();
      }, 4150);
    }
  }


  closeModal(id: number): void{
    if(id === 0) {
      setTimeout(() => {
        this.closeModalEvent.emit(this.pokemonName);
        this.msgState.emit(this.currentImgIndex === 0);
      }, 1920)
      return;
    }
    setTimeout(() => {
      this.closeModalEvent.emit(this.pokemonName);
      this.msgState.emit(this.currentImgIndex === 0);
    }, 7340)
  }

  // To reset the gif image each time button is clicked
  reloadGif(): void {
    const imageElement = this.gifImage.nativeElement;
    const currentSrc = imageElement.src;

    // Change the src to reload the image
    imageElement.src = '';
    imageElement.src = currentSrc;
  }
}
