import { Routes } from '@angular/router';
import { AuthentificationComponent } from './authentification/authentification.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './auth.guard';
import { ChatComponent } from './chat/chat.component';

export const routes: Routes = [
    {
      path: 'connexion',
      component: AuthentificationComponent,
    },
    {
      path: '',
      component: HomeComponent,
      canActivate: [authGuard],
    },
    {
      path: 'chat/:conversationId',
      component: ChatComponent,
      canActivate: [authGuard],
    }
];
