import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PokedetailsComponent } from './components/pokedetails/pokedetails.component';

const routes: Routes = [
    {path: 'details/:slug', component: PokedetailsComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
