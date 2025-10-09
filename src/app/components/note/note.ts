import { TextFieldModule } from '@angular/cdk/text-field';
import { Component, effect, inject, signal } from '@angular/core';
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
  protected readonly tabs = signal<TabOptions[]>([
    {
      id: '1',
      name: 'This really has content',
      content: `| Column 1 | Column 2 | Column 2a | Column 3 | Column 3a | Column 4 | Column 5 | Column 6 | Column 7 | Column 7a | Column 5a | Column 4a | Column 8 | Column 1a |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Row 1 Data | Row 1 Data 2 |  More data | Even more |  A lot | Lots more | Even more again | A ridiculous amount |  Overload | Overflowing | Data Overflow | More overflow | Stuff |  So much more |
| Row 2 Data | Row 2 Data 2 |  More data | Even more |  A lot | Lots more | Even more again | A ridiculous amount |  Overload | Overflowing | Data Overflow | More overflow | Stuff |  So much more |

`,
    },
    {
      id: '2',
      name: "Manager's Moment",
      content: 'No content',
    },
    {
      id: '3',
      name: 'Random Notes',
      content: 'No content',
    },
  ]);

  protected readonly selectedTabIndex = signal<number>(-1);
  protected readonly noteContent = signal<string | null | undefined>(undefined);
  protected readonly debouncedContent = debounced(this.noteContent, 5_000);

  protected readonly draft = trpcResource(
    this.trpc.note.upgetNote.mutate,
    () => ({ content: this.debouncedContent() }),
    { autoRefresh: true }
  );

  private readonly _syncContent = effect(() => {
    const draftContent = this.draft.value()?.content;
    if (draftContent) {
      this.noteContent.set(draftContent);
    }
  });

  private saveNote() {
    const content = this.noteContent();
    if (content && content.trim() !== '') {
      this.trpc.note.saveNote.mutate(null);
      this.snackBar.open('Note saved', 'Dismiss', {
        duration: 3000,
      });
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
}
