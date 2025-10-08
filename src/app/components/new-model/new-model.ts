import { Component, inject, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-new-model',
  imports: [
    MatFormFieldModule,
    MatInput,
    MatDialogModule,
    MatButton,
    FormsModule,
    MatProgressBarModule,
  ],
  templateUrl: './new-model.html',
  styleUrl: './new-model.scss',
})
export class NewModel {
  private readonly trpc = inject(TRPC_CLIENT);
  readonly dialogRef = inject(MatDialogRef<NewModel>);

  protected readonly name = signal<string>('');
  protected readonly progress = signal<
    { status: string; total: number; completed: number }[]
  >([]);

  protected readonly isLoading = signal<boolean>(false);

  percentage(part: number | undefined, whole: number | undefined) {
    if (part === undefined || whole === undefined) {
      return 0;
    }
    return Math.floor((100 * part) / whole);
  }

  cancel() {
    this.dialogRef.close();
  }

  async pull() {
    this.isLoading.set(true);
    try {
      const response = await this.trpc.models.pullModel.query(this.name());
      for await (const part of response) {
        this.progress.update(array => {
          const index = array.findIndex(value => value.status === part.status);

          if (index === -1) {
            array.push(part);
          } else {
            array[index] = part;
          }

          return array;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading.set(false);
    }

    this.dialogRef.close(true);
  }
}
