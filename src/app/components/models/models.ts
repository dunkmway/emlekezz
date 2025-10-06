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
  protected readonly displayedColumns: string[] = ['name', 'size', 'actions'];

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

  formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes)) return String(bytes);

    const sign = bytes < 0 ? '-' : '';
    let n = Math.abs(bytes);

    const base = 1000;
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    if (n < 1) return `${sign}0 B`;

    const exponent = Math.min(
      Math.floor(Math.log(n) / Math.log(base)),
      units.length - 1
    );

    const value = n / Math.pow(base, exponent);

    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: false,
    });

    return `${sign}${formatter.format(value)} ${units[exponent]}`;
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
