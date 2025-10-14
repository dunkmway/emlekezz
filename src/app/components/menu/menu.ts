import {
  Component,
  computed,
  inject,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { trpcResource } from '../../utils/trpcResource';
import { MatButton } from '@angular/material/button';
import { Profile } from '../profile/profile';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmationDialog } from '../confirmation/confirmation.dialog';

@Component({
  selector: 'app-menu',
  imports: [MatButton, Profile, MatIconModule],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu {
  private readonly trpc = inject(TRPC_CLIENT);
  private readonly confirmation = inject(ConfirmationDialog);
  private readonly page = signal(0);

  noteClick = output<string>();

  protected readonly getNotes = trpcResource(
    this.trpc.user.getUserNotes.mutate,
    () => ({
      page: this.page(),
    }),
    { autoRefresh: true }
  );

  protected readonly allNotes = linkedSignal<
    ReturnType<typeof this.getNotes.value>,
    ReturnType<typeof this.getNotes.value>
  >({
    source: this.getNotes.value,
    computation: (newNotes, previousList) => [
      ...(previousList?.value ?? []),
      ...(newNotes ?? []),
    ],
  });

  private readonly isEnd = computed(() => {
    return this.getNotes.value()?.length === 0;
  });

  protected onScroll(event: any): void {
    const scrollTop = event.target.scrollTop;
    const scrollHeight = event.target.scrollHeight;
    const offsetHeight = event.target.offsetHeight;

    if (
      scrollHeight - (scrollTop + offsetHeight) < 50 &&
      !this.isEnd() &&
      !this.getNotes.isLoading()
    ) {
      this.page.update(prev => prev++);
      this.getNotes.refresh();
    }
  }

  protected deleteNote(event: MouseEvent, id: string) {
    event.stopPropagation();
    this.confirmation
      .open({
        action: 'delete this note',
      })
      .afterClosed()
      .subscribe(async result => {
        if (result) {
          await this.trpc.user.deleteNote.mutate({ id });
          this.allNotes.update(notes => {
            notes?.splice(
              notes.findIndex(note => note.id),
              1
            );
            return notes;
          });
        }
      });
  }
}
