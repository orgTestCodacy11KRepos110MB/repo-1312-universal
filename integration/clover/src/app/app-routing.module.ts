import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PokedexComponent } from './pokedex.component';
import { HomepageComponent } from './homepage.component';

const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'lazy', loadChildren: () => import('./lazy/lazy.module').then((m) => m.LazyModule) },
  { path: '**', component: PokedexComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
