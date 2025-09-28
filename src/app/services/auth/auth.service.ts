import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Permission, Role, ROLE_PERMISSION_MAP } from '../../../security';

type WhoAmI = {
  id: string;
  username: string;
  roles: Role[];
  permissions: Permission[];
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly router = inject(Router);

  constructor() {
    this.whoAmI();
  }

  authenticated = signal(false);
  userId = signal<string | undefined>(undefined);
  username = signal<string | undefined>(undefined);
  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);

  /**
   * Contains all of the user's permissions, meaning those explicitly given, as well as
   * those provided by the user's roles.
   *
   * The result is a `Set` containing all unique permissions granted to the user.
   */
  effectivePermissions = computed(
    () =>
      new Set(
        this.roles()
          .flatMap(role => ROLE_PERMISSION_MAP[role])
          .concat(this.permissions())
      )
  );

  private resetAuthState() {
    this.authenticated.set(false);
    this.userId.set(undefined);
    this.username.set(undefined);
    this.roles.set([]);
    this.permissions.set([]);
  }

  private setUser(user: WhoAmI) {
    this.authenticated.set(true);
    this.userId.set(user.id);
    this.username.set(user.username);
    this.roles.set(user.roles);
    this.permissions.set(user.permissions);
  }

  /**
   * Logs the user out by resetting the authentication state and redirecting to the login page.
   */
  async logout() {
    await fetch(location.origin + '/sys/logout', {
      method: 'POST',
    });

    window.location.href = '/login';
  }

  /**
   * Retrieves information about the currently authenticated user.
   *
   * @returns A promise that resolves to a `WhoAmI` object
   * representing the current user, or `null` if not authenticated or on error.
   */
  async whoAmI(): Promise<WhoAmI | null> {
    try {
      const res = await fetch('/sys/who-am-i');
      const user = await res.json();
      if (!user) {
        this.resetAuthState();
        return null;
      }
      this.setUser(user);
      return user;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}
