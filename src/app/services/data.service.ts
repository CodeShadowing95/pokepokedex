import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
    private apiUrl = 'https://pokedex2.p.rapidapi.com/pokedex/uk';
    // private apiKey = environment.apiKey;
    private apiKey = 'd8adc9738emsh581515b396e9e0ep1605cajsn21713ff44a9c';
    private apiHost = 'pokedex2.p.rapidapi.com';

  constructor(private http: HttpClient) { }

  getPokemons(): Observable<any> {
    const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': this.apiHost,
    });

    // const url = `${this.apiUrl}?page=${page}&pageSize=${pageSize}`;

    return this.http.get(this.apiUrl, { headers });
  }

  getPokemonDetails(name: string): Observable<any> {
    const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': this.apiHost,
    });

    const url = `${this.apiUrl}/${name}`;
    return this.http.get(url, { headers });
  }
}
