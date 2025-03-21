import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, from, map, take } from 'rxjs';
import { AuthService } from './auth.service';

export const authResolver: ResolveFn<boolean> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowUnauthenticated = route.data['allowUnauthenticated'] === true;

  return from(Promise.resolve(authService.checkAuth())).pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }

      if (allowUnauthenticated) {
        return false;
      }

      router.navigate(['/auth']);
      return false;
    })
  );
};
