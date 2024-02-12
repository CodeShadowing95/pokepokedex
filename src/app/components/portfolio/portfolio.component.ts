import { Component } from '@angular/core';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css'
})
export class PortfolioComponent {
  toMyPortfolio() {
    window.open('https://patricknamegni.vercel.app/', '_blank');
  }
}
