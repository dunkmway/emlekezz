import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { trpcResource } from '../../utils/trpcResource';

@Component({
  selector: 'app-user-models',
  imports: [MatTableModule, MatButton],
  templateUrl: './user-models.html',
  styleUrl: './user-models.scss',
})
export class UserModels {
  private readonly trpc = inject(TRPC_CLIENT);
  protected readonly displayedColumns: string[] = ['name', 'actions'];

  getModels = trpcResource(this.trpc.user.getUserModels.mutate, () => null, {
    autoRefresh: true,
  });

  async setChatModel(name: string) {
    await this.trpc.user.setModel.mutate({
      model: name,
      type: 'chat',
    });

    this.getModels.refresh();
  }

  async setEmbeddingModel(name: string) {
    await this.trpc.user.setModel.mutate({
      model: name,
      type: 'embedding',
    });

    this.getModels.refresh();
  }
}
