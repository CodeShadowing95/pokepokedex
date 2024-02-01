import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeroComponent } from './components/hero/hero.component';
import { PokepanelComponent } from './components/pokepanel/pokepanel.component';
import { PokecardComponent } from './components/pokecard/pokecard.component';
import { PokedetailsComponent } from './components/pokedetails/pokedetails.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { PaginationComponent } from './components/pagination/pagination.component';

@NgModule({
  declarations: [
    AppComponent,
    HeroComponent,
    PokepanelComponent,
    PokecardComponent,
    PokedetailsComponent,
    PaginationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
  ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
