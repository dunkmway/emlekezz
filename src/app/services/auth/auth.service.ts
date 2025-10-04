import { computed, Injectable, signal } from '@angular/core';
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
  private readonly readyPromise: Promise<WhoAmI | null>;

  constructor() {
    this.readyPromise = this.whoAmI();
  }

  /**
   * Returns a promise that resolves when the authentication service is ready.
   */
  ready() {
    return this.readyPromise;
  }

  /**
   * Updates the authentication state by retrieving the current user's information.
   *
   * @returns A promise containing the current user's authentication details.
   */
  update() {
    return this.whoAmI();
  }

  readonly authenticated = signal(false);
  readonly userId = signal<string | undefined>(undefined);
  readonly username = signal<string | undefined>(undefined);
  readonly roles = signal<Role[]>([]);
  readonly permissions = signal<Permission[]>([]);

  /**
   * Contains all of the user's permissions, meaning those explicitly given, as well as
   * those provided by the user's roles.
   *
   * The result is a `Set` containing all unique permissions granted to the user.
   */
  readonly effectivePermissions = computed(
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
  private async whoAmI(): Promise<WhoAmI | null> {
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
