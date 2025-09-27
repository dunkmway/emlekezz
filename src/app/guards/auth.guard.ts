import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

/**
 * This guard checks if the client is authenticated, redirecting to login if not.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const usr = await authService.whoAmI();
  if (!usr) {
    authService.login(state.url);
    return false;
  }
  return true;
};
