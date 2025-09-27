import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Permission, Role, ROLE_PERMISSION_MAP } from '../../../security';

type WhoAmI = {
  id: string;
  firstName: string;
  lastName: string;
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
  firstName = signal<string | undefined>(undefined);
  lastName = signal<string | undefined>(undefined);
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

  /**
   * Computes the user's preferred full name by concatenating the preferred first name
   * and, if available, the preferred last name separated by a space.
   * If the preferred first name is not set, an empty string is used.
   * If the preferred last name is not set, only the first name is returned.
   *
   * @returns The computed preferred full name as a string.
   */
  preferredName = computed(() => {
    const prefLast = this.lastName();
    return `${this.firstName() ?? ''}${prefLast ? ` ${prefLast}` : ''}`;
  });

  private resetAuthState() {
    this.authenticated.set(false);
    this.userId.set(undefined);
    this.firstName.set(undefined);
    this.lastName.set(undefined);
    this.roles.set([]);
    this.permissions.set([]);
  }

  private setUser(user: WhoAmI) {
    this.authenticated.set(true);
    this.userId.set(user.id);
    this.firstName.set(user.firstName);
    this.lastName.set(user.lastName);
    this.roles.set(user.roles);
    this.permissions.set(user.permissions);
  }

  /**
   * Redirects the user to the login page.
   *
   * @param nextUri - (Optional) The URI to redirect to after login.
   */
  login(nextUri?: string) {
    window.location.href = `/login${nextUri ? `?next_uri=${nextUri}` : ''}`;
  }

  /**
   * Logs the user out by resetting the authentication state and redirecting to the logout page.
   */
  logout() {
    this.resetAuthState();
    window.location.href = '/logout';
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
