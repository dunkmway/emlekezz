import { TextFieldModule } from '@angular/cdk/text-field';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TabOptions, Tabs } from '../tabs/tabs';
import { MarkdownComponent } from 'ngx-markdown';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { trpcResource } from '../../utils/trpcResource';
import { debounced } from '../../utils/debounced';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

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
      content: 'No content',
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
    this.trpc.upgetNote.mutate,
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
    this.snackBar.open('Note saved', 'Dismiss', {
      duration: 3000,
    });
  }

  protected handleKeydown(event: KeyboardEvent) {
    const key = event.key;
    const target = event.target as HTMLInputElement;
    const selectionStart = target.selectionStart!;
    const selectionEnd = target.selectionEnd!;

    if (key === 'Tab') {
      event.preventDefault();
      target.value =
        target.value.substring(0, selectionStart) +
        '\t' +
        target.value.substring(selectionEnd);
      target.selectionStart = target.selectionEnd = selectionStart + 1;
    } else if (key === 'b' && event.ctrlKey) {
      event.preventDefault();
      target.value =
        target.value.substring(0, selectionStart) +
        '**' +
        target.value.substring(selectionStart, selectionEnd) +
        '**' +
        target.value.substring(selectionEnd);
      target.selectionStart = target.selectionEnd = selectionStart + 2;
    } else if (key === 'i' && event.ctrlKey) {
      event.preventDefault();
      target.value =
        target.value.substring(0, selectionStart) +
        '*' +
        target.value.substring(selectionStart, selectionEnd) +
        '*' +
        target.value.substring(selectionEnd);
      target.selectionStart = target.selectionEnd = selectionStart + 2;
    } else if (key === 's' && event.ctrlKey) {
      event.preventDefault();
      this.saveNote();
    }
  }
}
