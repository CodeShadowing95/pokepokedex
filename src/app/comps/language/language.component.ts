import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-language',
  templateUrl: './language.component.html',
  styleUrl: './language.component.css'
})
export class LanguageComponent implements OnInit {
  currentLanguage!: string;

  ngOnInit(): void {
    this.currentLanguage = 'en';
  }

  changeLang() {
    this.currentLanguage = this.currentLanguage === 'en' ? 'fr' : 'en';
  }
}
