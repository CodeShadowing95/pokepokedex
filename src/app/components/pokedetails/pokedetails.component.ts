import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../data.service';
import { PokemonProps } from '../../../types';

@Component({
  selector: 'app-pokedetails',
  templateUrl: './pokedetails.component.html',
  styleUrl: './pokedetails.component.css'
})
export class PokedetailsComponent implements OnInit {
    pokemon: PokemonProps | undefined;

    constructor(private route: ActivatedRoute, private pokemonService: DataService) {}

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            const name = params['slug'];
            this.pokemonService.getPokemonDetails(name).subscribe(
                (data) => {
                    this.pokemon = data;
                },
                (error) => {
                    console.log(error);
                }
            )
        })
    }
}
