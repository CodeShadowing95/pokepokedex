import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { DataService } from '../../services/api/data.service';
import { PokemonProps } from '../../../types';
import { pokemonTypes } from '../../../constants';


@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
})
export class ModalComponent implements OnInit {
    pokemonInfo: PokemonProps | undefined;
    @Input() pokemonName!: string;
    @Output() closeModalEvent: EventEmitter<string> = new EventEmitter<string>();

    constructor(private pokemonService: DataService) {}

    ngOnInit(): void {
        this.pokemonService.getPokemons().subscribe((res: PokemonProps[]) => {
            const info = res.find((p) => p.name === this.pokemonName);
            // console.log(pokemon);
            this.pokemonInfo = info;
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

    closeModal(): void{
        this.closeModalEvent.emit(this.pokemonName);
    }
}
