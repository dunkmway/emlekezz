import { Component, inject, signal } from '@angular/core';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { trpcResource } from '../../utils/trpcResource';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-profile',
  imports: [MatInputModule, MatFormFieldModule, FormsModule, MatButton],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfile {
  private readonly trpc = inject(TRPC_CLIENT);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly currentPassword = signal<string>('');
  protected readonly newPassword = signal<string>('');

  protected readonly changePassword = trpcResource(
    this.trpc.user.changePassword.mutate,
    () => ({
      old: this.currentPassword(),
      new: this.newPassword(),
    })
  );

  async changePasswordClick() {
    if (await this.changePassword.refresh()) {
      this.snackBar.open('Password changed', 'Dismiss', {
        duration: 3000,
      });
      this.currentPassword.set('');
      this.newPassword.set('');
    }
  }
}
