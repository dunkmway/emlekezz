import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { trpcResource } from '../../utils/trpcResource';
import { MatDialog } from '@angular/material/dialog';
import { NewModel } from '../new-model/new-model';
import { ConfirmationDialog } from '../confirmation/confirmation.dialog';

@Component({
  selector: 'app-models',
  imports: [MatTableModule, MatButton],
  templateUrl: './models.html',
  styleUrl: './models.scss',
})
export class Models {
  private readonly trpc = inject(TRPC_CLIENT);
  private readonly confirmation = inject(ConfirmationDialog);
  private readonly dialog = inject(MatDialog);
  protected readonly displayedColumns: string[] = ['name', 'actions'];

  getModels = trpcResource(this.trpc.models.getModels.mutate, () => null, {
    autoRefresh: true,
  });

  deleteModel(name: string) {
    const confirm = this.confirmation.open({
      action: `delete the model ${name}`,
    });

    confirm.afterClosed().subscribe(async result => {
      if (result) {
        await this.trpc.models.removeModel.mutate(name);
        await this.getModels.refresh();
      }
    });
  }

  openNewModelDialog() {
    const dialogRef = this.dialog.open(NewModel);

    dialogRef.afterClosed().subscribe(didSave => {
      if (didSave) {
        this.getModels.refresh();
      }
    });
  }
}
