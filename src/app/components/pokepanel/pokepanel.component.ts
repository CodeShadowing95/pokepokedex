import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { PokemonProps } from '../../../types';

@Component({
  selector: 'app-pokepanel',
  templateUrl: './pokepanel.component.html'
})
export class PokepanelComponent implements OnInit {
    data: PokemonProps[] = [];
    currentPage = 1;
    numberOfPages = 1;

    constructor(private dataService: DataService) {}

    ngOnInit(): void {
        this.loadPokemons();
    }

    loadPokemons(): void {
        const startIndex = (this.currentPage - 1) * 10;
        const endIndex = startIndex + 10;
    
        this.dataService.getPokemons().subscribe((response: PokemonProps[]) => {
            const res = response.slice(0, 100);
            this.data = res.slice(startIndex, endIndex);
            this.numberOfPages = Math.ceil(res.length / 10);
        });
    }

    onPreviousPageClick(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadPokemons();
        }
    }
 
    onNextPageClick(): void {
        this.currentPage++;
        this.loadPokemons();
    }

    onPageChange(pageNumber: number): void {
        this.currentPage = pageNumber;
        this.loadPokemons();
    }
}
