import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DataService } from '../../services/data.service';
import { pokemonTypes } from '../../../constants';

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

    constructor(private route: ActivatedRoute, private pokemonService: DataService, private router: Router) {}

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            const name = params['slug'];
            this.pokemonService.getPokemonDetails(name).subscribe(
                (data) => {
                    console.log(data[0]);
                    this.pokemon = data[0];
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

    catchMessage(name: string): void {
        alert("💫 Congtaulations, you caught " + name + " 💫");
    }

    navigateToHome() {
        this.router.navigate(['/']);
    }
}
