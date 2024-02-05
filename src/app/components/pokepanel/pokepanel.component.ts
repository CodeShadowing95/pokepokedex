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
    typeProperty: string = 'all types'

    currentPage = 1;
    numberOfPages = 1;

    filteredDatas: any[] = [];
    filteredDatasByType: any[] = [];

    constructor(private pokemonService: DataService, private shuffleService: ShuffleService) {}

    ngOnInit(): void {
        this.loadPokemons();
    }

    loadPokemons(): void {
        const startIndex = (this.currentPage - 1) * 10;
        const endIndex = startIndex + 10;
    
        this.pokemonService.getPokemons().subscribe((response: PokemonProps[]) => {
            const res = response.slice(0, 100);
            this.pokemons = res;
            this.data = res.slice(startIndex, endIndex);
            this.numberOfPages = Math.ceil(res.length / 10);
        });
    }

    // loadFilteredPokemonsByType(): void {
    //     const startIndex = (this.currentPage - 1) * 10;
    //     const endIndex = startIndex + 10;

    //     const res = this.filteredDatasByType.slice(0, 100);
    //     this.pokemons = res;
    //     this.data = res.slice(startIndex, endIndex);
    //     this.numberOfPages = Math.ceil(res.length / 10);
    // }

    onPreviousPageClick(): void {
        this.currentPage--;
        this.loadPokemons();
        // if(this.typeProperty !== 'all types') {
        //     this.loadFilteredPokemonsByType();
        // } else {
        //     this.loadPokemons();
        // }
    }
 
    onNextPageClick(): void {
        this.currentPage++;
        this.loadPokemons();
        // if(this.typeProperty !== 'all types') {
        //     this.loadFilteredPokemonsByType();
        // } else {
        //     this.loadPokemons();
        // }
    }

    onPageChange(pageNumber: number): void {
        this.currentPage = pageNumber;
        this.loadPokemons();
        // if(this.typeProperty !== 'all types') {
        //     this.loadFilteredPokemonsByType();
        // } else {
        //     this.loadPokemons();
        // }
    }

    onSearchChange(searchTerm: string): void {
        this.filteredDatas = this.filterItemsByName(searchTerm);
    }

    onTypeSearch(type: string): void {
        this.typeProperty = type;
        // this.filterItemsByType(this.typeProperty);
    }

    private filterItemsByName(searchTerm: string): any[] {
        if(searchTerm) {
            return this.pokemons.filter((pokemon) => (
                pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
            ));
        }
        return this.data;
    }

    // private filterItemsByType(type: string): void {
    //     this.pokemonService.getPokemons().subscribe((result) => {
    //         const shuffledPokemons: PokemonProps[] = this.shuffleService.shuffleArray(result);

    //         if (type !== 'all types') {
    //             this.filteredDatasByType = shuffledPokemons.filter((pokemon) => pokemon.type.includes(type));
    //             this.loadFilteredPokemonsByType();
    //         } else {
    //             this.loadPokemons();
    //         }
    //     })
    // }
}
