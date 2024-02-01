import { Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../../data.service';
import { PokemonProps } from '../../../types';

@Component({
  selector: 'app-pokepanel',
  templateUrl: './pokepanel.component.html'
})
export class PokepanelComponent implements OnInit {
    data: PokemonProps[] = [];
    currentPage = 1;
    pageSize = 10;
    totalItems = 0;

    constructor(private dataService: DataService) {}

    ngOnInit(): void {
        this.loadPokemons();
    }

    loadPokemons(): void {
        this.dataService.getData().subscribe((response: any) => {
        this.data = response.slice(0, 100);
        this.totalItems = this.data.length;
      });
    }
}
