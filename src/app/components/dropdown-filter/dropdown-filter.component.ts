import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { pokemonTypes } from '../../../constants';

@Component({
  selector: 'app-dropdown-filter',
  templateUrl: './dropdown-filter.component.html',
  styleUrl: './dropdown-filter.component.css'
})
export class DropdownFilterComponent implements OnInit {
    open: boolean = false;
    types = pokemonTypes;
    selectedItem: string | undefined;
    className!: string;
    @Output() searchByType = new EventEmitter<string>();
    
    // bgColor!: string;
    // textColor!: string;
    // pkmType: string | undefined;


    ngOnInit(): void {
        this.selectedItem = 'all types';
        this.className = 'bg-gray-100 text-black capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center'
    }

    toggle() {
        this.open = !this.open
    }

    getType(p_type: string): void {
        this.selectedItem = p_type;
        this.changeBgColorByType(p_type);
        
        this.onTypeSearch();

        this.open = !this.open;
    }

    getBgColor(type_p: string): string {
        const ptype: any = this.types.find((type) => type.name === type_p);
        // console.log(ptype?.color);
        return ptype?.color;
    }

    changeBgColorByType(type_p: string): void {
        switch (type_p.toLowerCase()) {
            case 'all types':
                this.className = `bg-gray-100 text-black capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'bug':
                this.className = `bg-[#A6B91A] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'dark':
                this.className = `bg-[#705746] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'dragon':
                this.className = `bg-[#6F35FC] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'electric':
                this.className = `bg-[#F7D02C] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'fairy':
                this.className = `bg-[#D685AD] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'fighting':
                this.className = `bg-[#C22E28] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'fire':
                this.className = `bg-[#EE8130] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'flying':
                this.className = `bg-[#A98FF3] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'ghost':
                this.className = `bg-[#735797] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'grass':
                this.className = `bg-[#7AC74C] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'ground':
                this.className = `bg-[#E2BF65] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'ice':
                this.className = `bg-[#96D9D6] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'normal':
                this.className = `bg-[#A8A77A] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'poison':
                this.className = `bg-[#A33EA1] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'psychic':
                this.className = `bg-[#F95587] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'rock':
                this.className = `bg-[#474026] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'steel':
                this.className = `bg-[#B7B7CE] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            case 'water':
                this.className = `bg-[#6390F0] text-white capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
                break;
            default:
                break;
        }
        // if(type_p === 'all types'){
        //     this.className = `bg-gray-100 text-black capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
        // } else {
        //     this.pkmType = this.getBgColor(type_p);
        //     // console.log(this.pkmType);
        //     this.bgColor = `bg-[${this.pkmType}]`;
        //     // console.log(this.bgColor);
        //     this.textColor = 'text-white';
        //     this.className = `${this.bgColor} ${this.textColor} capitalize font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`
        // }
    }

    onTypeSearch(): void {
        this.searchByType.emit(this.selectedItem);
    }
}
