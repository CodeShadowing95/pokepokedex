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
import { HomeComponent } from './components/home/home.component';
import { BackbuttonComponent } from './components/backbutton/backbutton.component';
import { SearchbarComponent } from './components/searchbar/searchbar.component';
import { DropdownFilterComponent } from './components/dropdown-filter/dropdown-filter.component';
import { DialogBoxComponent } from './components/dialog-box/dialog-box.component';
import { LikeComponent } from './components/like/like.component';
import { DialogCatchComponent } from './components/dialog-catch/dialog-catch.component';
import { FooterComponent } from './components/footer/footer.component';
import { NavComponent } from './components/nav/nav.component';
import { LanguageComponent } from './components/language/language.component';

@NgModule({
  declarations: [
    AppComponent,
    HeroComponent,
    PokepanelComponent,
    PokecardComponent,
    PokedetailsComponent,
    PaginationComponent,
    HomeComponent,
    BackbuttonComponent,
    SearchbarComponent,
    DropdownFilterComponent,
    DialogBoxComponent,
    LikeComponent,
    DialogCatchComponent,
    FooterComponent,
    NavComponent,
    LanguageComponent,
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
