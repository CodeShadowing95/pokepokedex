import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

import { PokemonProps } from '../../../types';
import { pokemonTypes } from '../../../constants';

@Component({
  selector: 'app-pokecard',
  templateUrl: './pokecard.component.html',
})
export class PokecardComponent {
    @Input() data: PokemonProps | undefined;
    @Input() imgDimension: number = 250;
    @Input() typeImgDimensions: number = 100;
    @Input() showButton: boolean = false;

    constructor(private router: Router) {}

    getPokemonType(typeName: string): string {
        const pokeType = pokemonTypes.find((type) => type.name === typeName);
        return pokeType ? pokeType.image : '';
    }

    navigateToPokemonDetails(slug: string): void {
        this.router.navigate(['pokemon/', slug]);
    }
}
