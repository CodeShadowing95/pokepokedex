import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DataService } from '../../services/api/data.service';
import { pokemonTypes } from '../../../constants';
import { ShuffleService } from '../../services/shuffle/shuffle.service';
import { PokemonProps } from '../../../types';

@Component({
  selector: 'app-pokedetails',
  templateUrl: './pokedetails.component.html',
  styleUrl: './pokedetails.component.css'
})
export class PokedetailsComponent implements OnInit {
    pokemon!: PokemonProps;

    shuffledPokemons!: PokemonProps[];
    pokemons_5!:PokemonProps[];

    isModalOpen: boolean = false;
    pokemonName!: string;

    isDialogOpen: boolean = false;

    constructor(private route: ActivatedRoute, private pokemonService: DataService, private router: Router, private shuffleService: ShuffleService) {}

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            const name = params['slug'];
            console.log(name);

            this.getPokemonDetail(name);
            
            this.pokemonService.getPokemonDetails(name).subscribe(
                () => {
                    this.pokemonService.getPokemons().subscribe((res) => {
                        this.shuffledPokemons = this.shuffleService.shuffleArray(res);
                        
                        this.pokemons_5 = this.get_5_firstTypes(this.shuffledPokemons, this.pokemon.type).slice(0, 5);
                    })
                },
                (error) => {
                    console.log(error);
                }
            )
        })
    }

    getPokemonDetail(name: string): void {
        this.pokemonService.getPokemons().subscribe((response: PokemonProps[]) => {
            const res: PokemonProps[] = response;

            this.pokemon = res.filter((p) => (
                p.name.toLowerCase().includes(name)
            ))[0]
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

    get_5_firstTypes(pokemonDatas: PokemonProps[], types: string[]): PokemonProps[] {
        // Get all the pokemons without the one selected
        let filteredDatas = pokemonDatas.filter((pokemonData) => (
            !pokemonData.name.toLowerCase().includes(this.pokemon.name.toLowerCase())
        ));

        // Get all the pokemons with same types as the selected pokemon
        const pkms = filteredDatas.filter((pkm) => (
            types.some((type) => pkm.type.includes(type.toLowerCase()))
        ));

        return pkms;
    }

    catchPokemon(name: string): void {
        // alert("💫 Congratulations, you caught " + name + " 💫");
        this.isDialogOpen = !this.isDialogOpen;
    }

    navigateToHome() {
        this.router.navigate(['/']);
    }

    toggleModal(name: string): void {
        this.isModalOpen = !this.isModalOpen;
        this.pokemonName = name;
    }

    showMessage(msgState: boolean) {
        if(msgState) {
            setTimeout(() => {
                alert("Sorry, the Pokemon refused you and run away 😞. Retry later 😆.");
            }, 200)
        } else {
            setTimeout(() => {
                alert("💫🎉🎉 Let's go, you caught a " + this.pokemon.name + " 💫🎉🎉");
            }, 200)
        }
    }

    toggleDialog(name: string): void {
        this.isDialogOpen = !this.isDialogOpen;
        this.pokemonName = name;
    }
}
