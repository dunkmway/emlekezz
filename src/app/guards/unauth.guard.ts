import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

/**
 * This guard checks if the client is unauthenticated, redirecting to home if not.
 */
export const unAuthGuard: CanActivateFn = async (_route, _state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const user = await authService.ready();
  if (user) {
    return new RedirectCommand(router.parseUrl('/'));
  }
  return true;
};
