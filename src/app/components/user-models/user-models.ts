import { Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { trpcResource } from '../../utils/trpcResource';
import { ConfirmationDialog } from '../confirmation/confirmation.dialog';

@Component({
  selector: 'app-user-models',
  imports: [MatTableModule, MatButton],
  templateUrl: './user-models.html',
  styleUrl: './user-models.scss',
})
export class UserModels {
  private readonly trpc = inject(TRPC_CLIENT);
  private readonly confirmation = inject(ConfirmationDialog);
  protected readonly displayedColumns: string[] = ['name', 'actions'];

  protected readonly getModels = trpcResource(
    this.trpc.user.getUserModels.mutate,
    () => null,
    {
      autoRefresh: true,
    }
  );

  protected readonly embeddedChosen = computed(() => {
    return this.getModels.value()?.some(model => model.isEmbedding) ?? false;
  });

  async setChatModel(name: string) {
    await this.trpc.user.setModel.mutate({
      model: name,
      type: 'chat',
    });

    this.getModels.refresh();
  }

  async setEmbeddingModel(name: string) {
    this.confirmation
      .open({
        description: `Are you sure you want to use ${name} for embeddings? Once you select a model for embeddings you cannot change it.`,
        buttons: ['Cancel', 'Choose this model (cannot undo)'] as const,
      })
      .afterClosed()
      .subscribe(async result => {
        if (result === 'Choose this model (cannot undo)') {
          await this.trpc.user.setModel.mutate({
            model: name,
            type: 'embedding',
          });

          this.getModels.refresh();
        }
      });
  }
}
