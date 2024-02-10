import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/api/data.service';
import { PokemonProps } from '../../../types';
import { ShuffleService } from '../../services/shuffle/shuffle.service';

@Component({
  selector: 'app-pokepanel',
  templateUrl: './pokepanel.component.html'
})
export class PokepanelComponent implements OnInit {
    pokemons: PokemonProps[] = [];
    data: PokemonProps[] = [];
    filteredPokemons: PokemonProps[] = [];

    // Inputs
    searchParam: boolean = false;
    typeProperty: string = 'all types'

    currentPage = 1;
    numberOfPages = 1;
    countDatas = 0;

    filteredDatas: any[] = [];
    filteredDatasByType: any[] = [];

    constructor(private pokemonService: DataService, private shuffleService: ShuffleService) {}

    ngOnInit(): void {
        this.loadPokemons();
    }

    loadPokemons(): void {
        const startIndex = (this.currentPage - 1) * 12;
        const endIndex = startIndex + 12;
    
        this.pokemonService.getPokemons().subscribe((response: PokemonProps[]) => {

            // const res = this.shuffleService.shuffleArray(response);
            // const res = response.slice(0, 100);
            const res = response;
            this.countDatas = res.length;
            this.pokemons = res;
            this.data = res.slice(startIndex, endIndex);
            this.numberOfPages = Math.ceil(res.length / 12);
        });
    }

    onPreviousPageClick(): void {
        this.currentPage--;
        this.loadPokemons();
    }
 
    onNextPageClick(): void {
        this.currentPage++;
        this.loadPokemons();
    }

    onPageChange(pageNumber: number): void {
        this.currentPage = pageNumber;
        this.loadPokemons();
    }

    onSearchChange(searchTerm: string): void {
        this.searchParam = (searchTerm !== '');
        if(searchTerm) {
            this.filteredDatas = this.filterItemsByName(searchTerm);
        } else {
            this.filteredDatas = [];
            this.loadPokemons();
        }
    }

    onTypeSearch(type: string): void {
        this.typeProperty = type;
        this.filterPokemonsByType(this.typeProperty);
    }

    private filterItemsByName(searchTerm: string): any[] {
        if(searchTerm) {
            return this.pokemons.filter((pokemon) => (
                pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
            ));
        }
        return this.data;
    }

    private filterPokemonsByType(type: string): void {
        const shuffledPokemons: PokemonProps[] = this.shuffleService.shuffleArray(this.pokemons);

        if (type !== 'all types') {
            this.filteredDatasByType = shuffledPokemons.filter((pokemon) => pokemon.type.includes(type));
        } else {
            this.loadPokemons();
        }
    }
}
