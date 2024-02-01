import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pokedetails',
  templateUrl: './pokedetails.component.html',
  styleUrl: './pokedetails.component.css'
})
export class PokedetailsComponent implements OnInit {
    name: string | undefined;

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.name = params['slug'];
        })
    }
}
