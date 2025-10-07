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

  getModels = trpcResource(this.trpc.models.getModels.mutate, () => null, {
    autoRefresh: true,
  });

  setChatModel(name: string) {}

  setEmbeddingModel(name: string) {}
}
