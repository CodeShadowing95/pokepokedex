import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class DataService {
    private apiUrl = 'https://pokedex2.p.rapidapi.com/pokedex/uk';
    private apiKey = environment.apiKey;
    private apiHost = 'pokedex2.p.rapidapi.com';

  constructor(private http: HttpClient) { }

  getPokemons(): Observable<any> {
    const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': this.apiKey ?? '',
        'X-RapidAPI-Host': this.apiHost,
    });

    // const url = `${this.apiUrl}?page=${page}&pageSize=${pageSize}`;

    return this.http.get(this.apiUrl, { headers });
  }

  getPokemonDetails(name: string): Observable<any> {
    const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': this.apiKey ?? '',
        'X-RapidAPI-Host': this.apiHost,
    });

    const url = `${this.apiUrl}/${name}`;
    return this.http.get(url, { headers });
  }
}
