import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DataService } from '../../services/api/data.service';
import { pokemonTypes } from '../../../constants';
import { ShuffleService } from '../../services/shuffle/shuffle.service';
import { PokemonProps } from '../../../types';

interface PokemonDetail {
    abilities: string;
    category: string;
    height: string;
    name: string;
    sex: string[];
    slug: string;
    thumbnailalttext: string;
    thumbnailimage: string;
    type: string[];
    weaknesses: string[];
    weight: string;
}

@Component({
  selector: 'app-pokedetails',
  templateUrl: './pokedetails.component.html',
  styleUrl: './pokedetails.component.css'
})
export class PokedetailsComponent implements OnInit {
    pokemon!: PokemonDetail;

    shuffledPokemons!: PokemonProps[];
    pokemons!:PokemonProps[];

    isModalOpen: boolean = false;
    pokemonName!: string;

    constructor(private route: ActivatedRoute, private pokemonService: DataService, private router: Router, private shuffleService: ShuffleService) {}

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            const name = params['slug'];
            this.pokemonService.getPokemonDetails(name).subscribe(
                (data) => {
                    this.pokemon = data[0];
                    // console.log(this.pokemon);
                    this.pokemonService.getPokemons().subscribe((res) => {
                        this.shuffledPokemons = this.shuffleService.shuffleArray(res);
                        
                        this.pokemons = this.get_5_firstTypes(this.shuffledPokemons, this.pokemon.type).slice(0, 5);
                    })
                },
                (error) => {
                    console.log(error);
                }
            )
        })
    }

    getPokemonType(typeName: string): string {
        const pokeType = pokemonTypes.find((type) => type.name.toLowerCase() === typeName.toLowerCase());
        return pokeType ? pokeType.image : '';
    }

    getPokemonWeakness(weaknessType: string): string {
        const weakness = pokemonTypes.find((type) => type.name.toLowerCase() === weaknessType.toLowerCase());
        return weakness ? weakness.image : '';
    }

    get_5_firstTypes(data: PokemonProps[], types: string[]): PokemonProps[] {
        const pkms = data.filter((pkm) => (
            types.some((type) => pkm.type.includes(type.toLowerCase()))
        ));

        return pkms;
    }

    catchMessage(name: string): void {
        alert("💫 Congratulations, you caught " + name + " 💫");
    }

    navigateToHome() {
        this.router.navigate(['/']);
    }

    toggleModal(name: string): void {
        this.isModalOpen = !this.isModalOpen;
        this.pokemonName = name;
    }
}
