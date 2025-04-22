import { Routes } from '@angular/router';
import { AuthentificationComponent } from './authentification/authentification.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './auth.guard';
import { ChatComponent } from './chat/chat.component';
import { CallComponent } from './call/call.component';
import { CallCreateComponent } from './callCreate/callCreate.component';

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
    },
    {
      path: 'call',
      component: CallComponent,
      canActivate: [authGuard],
    },
    {
      path: 'callCreate',
      component: CallCreateComponent,
      canActivate: [authGuard],
    }
];
