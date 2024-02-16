import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-dialog-hint',
  templateUrl: './dialog-hint.component.html',
  styleUrl: './dialog-hint.component.css'
})
export class DialogHintComponent implements OnInit {
  @Output() closeModalEvt: EventEmitter<string> = new EventEmitter<string>();
  
  // Useful property to reset the gif image
  @ViewChild('gifImage', { static: false }) gifImage!: ElementRef;

  ngOnInit(): void {
    this.reloadGif();
  }

  closeModal() {
    this.closeModalEvt.emit("test");
  }

  reloadGif(): void {
    const imageElement = this.gifImage.nativeElement;
    const currentSrc = imageElement.src;

    // Change the src to reload the image
    imageElement.src = '';
    imageElement.src = currentSrc;
  }
}
