import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { PlayerStore } from './core/player.store';

/** Au tout premier passage sur l'accueil, on propose d'abord de créer son dresseur. */
const accueil = () => (inject(PlayerStore).nouveau() ? inject(Router).parseUrl('/bienvenue') : true);

/**
 * Chaque page est chargée « à la demande » (loadComponent) : le navigateur ne télécharge
 * le code de l'arène que si l'on ouvre l'arène.
 */
export const routes: Routes = [
  { path: '', title: 'Pokédex · papier & encre', canActivate: [accueil], loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'pokedex', title: 'Pokédex', loadComponent: () => import('./pages/pokedex/pokedex').then((m) => m.PokedexPage) },
  { path: 'pokemon/:id', title: 'Fiche Pokémon', loadComponent: () => import('./pages/fiche/fiche').then((m) => m.Fiche) },
  { path: 'bienvenue', title: 'Quel dresseur es-tu ?', loadComponent: () => import('./pages/starter/starter').then((m) => m.Starter) },
  { path: 'arene', title: 'Arène · Duel Éclair', loadComponent: () => import('./pages/arene/arene').then((m) => m.Arene) },
  { path: 'cartes', title: 'Mes cartes', loadComponent: () => import('./pages/cartes/cartes').then((m) => m.Cartes) },
  { path: 'qg', title: 'Mon QG', loadComponent: () => import('./pages/qg/qg').then((m) => m.Qg) },
  { path: 'equipe', title: 'Atelier d’équipe', loadComponent: () => import('./pages/equipe/equipe').then((m) => m.Equipe) },
  { path: 'campagne', title: 'Campagne', loadComponent: () => import('./pages/campagne/campagne').then((m) => m.Campagne) },
  { path: 'credits', title: 'Crédits · L’histoire de ce Pokédex', loadComponent: () => import('./pages/credits/credits').then((m) => m.Credits) },
  { path: '**', redirectTo: '' },
];
