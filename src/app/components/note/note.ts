import { TextFieldModule } from '@angular/cdk/text-field';
import {
  Component,
  effect,
  inject,
  model,
  output,
  signal,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TabOptions, Tabs } from '../tabs/tabs';
import { MarkdownComponent } from 'ngx-markdown';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { trpcResource } from '../../utils/trpcResource';
import { debounced } from '../../utils/debounced';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { markdownCommands } from './markdown';

@Component({
  selector: 'app-note',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    TextFieldModule,
    Tabs,
    MarkdownComponent,
  ],
  templateUrl: './note.html',
  styleUrl: './note.scss',
})
export class Note {
  private readonly trpc = inject(TRPC_CLIENT);
  private readonly snackBar = inject(MatSnackBar);

  readonly drawerOpen = output();

  protected readonly tabs = signal<TabOptions[]>([]);

  protected readonly selectedTabIndex = signal<number>(-1);
  protected readonly noteContent = signal<string | null | undefined>(undefined);
  protected readonly debouncedContent = debounced(this.noteContent, 5_000);

  protected readonly draft = trpcResource(
    this.trpc.draft.upgetDraft.mutate,
    () => ({ content: this.debouncedContent() }),
    { autoRefresh: true }
  );

  private readonly _syncContent = effect(() => {
    const draftContent = this.draft.value()?.content;
    if (draftContent) {
      this.noteContent.set(draftContent);
    }
  });

  private async saveNote() {
    const content = this.noteContent();
    if (content && content.trim() !== '') {
      this.snackBar.open('Note saving', 'Dismiss', {
        duration: 3000,
      });
      try {
        await this.trpc.draft.saveDraft.mutate(null);
      } catch {
        this.snackBar.open('Failed to save note', 'Dismiss', {
          duration: 3000,
        });
      }
    }
  }

  protected handleKeydown(event: KeyboardEvent) {
    this.noteContent.set(markdownCommands(event));

    // save the note
    if (event.key === 's' && event.ctrlKey) {
      event.preventDefault();
      this.saveNote();
    }
  }

  async addNoteTab(id: string) {
    const note = await this.trpc.user.getUserNote.mutate({ id });

    this.tabs.update(prev => {
      prev.push(note);
      return prev;
    });
  }
}
