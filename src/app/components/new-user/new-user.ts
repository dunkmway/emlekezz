import { Component, inject, linkedSignal, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButton } from '@angular/material/button';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { trpcResource } from '../../utils/trpcResource';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-new-user',
  imports: [
    MatFormFieldModule,
    MatInput,
    MatCheckboxModule,
    MatDialogModule,
    MatButton,
    FormsModule,
  ],
  templateUrl: './new-user.html',
  styleUrl: './new-user.scss',
})
export class NewUser {
  private readonly trpc = inject(TRPC_CLIENT);
  readonly dialogRef = inject(MatDialogRef<NewUser>);

  protected readonly isAdmin = signal<boolean>(false);
  protected readonly username = signal<string>('');
  protected readonly password = signal<string>('');
  protected readonly error = linkedSignal(
    () => this.createUser.error()?.message
  );

  createUser = trpcResource(this.trpc.users.createUser.mutate, () => ({
    isAdmin: this.isAdmin(),
    username: this.username(),
    password: this.password(),
  }));

  cancel() {
    this.dialogRef.close();
  }

  async save() {
    const username = this.username();
    const password = this.password();
    if (!username || !password) {
      this.error.set('Please fill in all fields');
      return;
    }

    if (await this.createUser.refresh()) {
      this.dialogRef.close(true);
    }
  }
}
