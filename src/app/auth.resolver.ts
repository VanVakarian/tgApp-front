import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const authResolver: ResolveFn<boolean> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | Promise<boolean> => {
  const authService = inject(AuthService);
  // const router = inject(Router);
  const allowUnauthenticated = route.data['allowUnauthenticated'] === true;

  const isAuthenticated = authService.checkAuth();

  if (isAuthenticated) {
    return true;
  }

  if (allowUnauthenticated) {
    return false;
  }

  // router.navigate(['/']);
  return false;
};
