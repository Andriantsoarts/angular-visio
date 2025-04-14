import { Routes } from '@angular/router';
import { AuthentificationComponent } from './authentification/authentification.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    {
      path: 'connexion',
      component: AuthentificationComponent,
    },
    {
      path: '',
      component: HomeComponent,
      canActivate: [authGuard],
    }
];
