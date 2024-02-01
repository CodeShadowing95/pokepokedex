import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PokedetailsComponent } from './components/pokedetails/pokedetails.component';
import { PokepanelComponent } from './components/pokepanel/pokepanel.component';

const routes: Routes = [
    { path: 'pokemon', component: PokepanelComponent },
    { path: 'pokemon/:slug', component: PokedetailsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
