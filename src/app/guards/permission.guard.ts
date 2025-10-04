import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { inject } from '@angular/core';
import { Permission } from '../../security';

/**
 * A permission-based route guard.
 *
 * This guard checks if the current user has the required permissions to access a route.
 * If the user is not authenticated, they are redirected to the login page.
 * If the user lacks the necessary permissions, they are redirected to the `/forbidden` page.
 *
 * @param requiredPermissions - An array of permission strings that the user must have.
 * @param haveAll - If `true`, the user must have all required permissions. If `false` or omitted, the user must have at least one of the required permissions.
 * @returns A `CanActivateFn` function to be used as a route guard.
 *
 * @example
 * ```typescript
 * const routes: Routes = [
 *   {
 *     path: 'admin',
 *     component: AdminPage,
 *     canActivate: [permissionGuard(['manage-users-full-access', 'see-data'], true)],
 *   },
 * ];
 * ```
 *
 * @see Permission
 */
export const permissionGuard: (
  requiredPermissions: Permission[],
  haveAll?: boolean
) => CanActivateFn = (reqPerms, haveAll) => {
  return async (_route, state) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    const user = await authService.ready();
    if (!user) {
      return new RedirectCommand(router.parseUrl('/login'));
    }

    const hasAccess = reqPerms[haveAll ? 'every' : 'some'](role =>
      authService.effectivePermissions().has(role)
    );

    return hasAccess || new RedirectCommand(router.parseUrl('/login'));
  };
};
