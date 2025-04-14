import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.user$.pipe(
    take(1),
    map(user => {
      const isLoggedIn = !!user;
      if (isLoggedIn) {
        return true;
      }
      return router.createUrlTree(['/connexion']);
    })
  );
};