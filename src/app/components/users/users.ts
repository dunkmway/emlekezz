import { Component, effect, inject } from '@angular/core';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { trpcResource } from '../../utils/trpcResource';
import { MatTableModule } from '@angular/material/table';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { NewUser } from '../new-user/new-user';
import { ConfirmationDialog } from '../confirmation/confirmation.dialog';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-users',
  imports: [MatTableModule, MatButton],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  private readonly trpc = inject(TRPC_CLIENT);
  private readonly dialog = inject(MatDialog);
  protected readonly auth = inject(AuthService);
  private readonly confirmation = inject(ConfirmationDialog);

  debug = effect(() => {
    console.log(this.auth.userId());
  });

  protected readonly displayedColumns: string[] = [
    'username',
    'roles',
    'actions',
  ];

  protected readonly getUsers = trpcResource(
    this.trpc.users.getUsers.mutate,
    () => null,
    { autoRefresh: true }
  );

  deleteUser(id: string, username: string) {
    const confirm = this.confirmation.open({
      action: `delete the user ${username}`,
    });

    confirm.afterClosed().subscribe(async result => {
      console.log(result);
      if (result) {
        await this.trpc.users.deleteUser.mutate({ id });
        await this.getUsers.refresh();
      }
    });
  }

  openNewUserDialog() {
    const dialogRef = this.dialog.open(NewUser);

    dialogRef.afterClosed().subscribe(didSave => {
      if (didSave) {
        this.getUsers.refresh();
      }
    });
  }
}
