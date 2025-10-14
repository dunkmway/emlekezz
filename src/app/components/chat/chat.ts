import { DatePipe } from '@angular/common';
import { Component, inject, output, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TextFieldModule } from '@angular/cdk/text-field';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { FormsModule } from '@angular/forms';
import { MarkdownComponent } from 'ngx-markdown';
import { MatChipsModule } from '@angular/material/chips';

type ChatStreamChunk = {
  type?: string;
  message?: { content?: string };
  done?: boolean;
  [key: string]: unknown;
};

type NoteReference = {
  noteId: string;
  index: number;
  title: string;
  storedDate: string | null;
};

type SearchNotesStreamItem =
  | { type: 'references'; references: NoteReference[] }
  | (ChatStreamChunk & { type: 'data' });

@Component({
  selector: 'app-chat',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    TextFieldModule,
    FormsModule,
    MarkdownComponent,
    MatChipsModule,
    DatePipe,
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  private readonly trpc = inject(TRPC_CLIENT);

  noteClick = output<string>();

  protected readonly searchQuery = signal<string | undefined>(undefined);
  protected readonly response = signal<string>('');
  protected readonly isLoading = signal<boolean>(false);
  protected readonly error = signal<string>('');
  protected readonly references = signal<NoteReference[]>([]);

  async searchNotes(event: Event) {
    event.preventDefault();
    const query = this.searchQuery();
    if (!query) return;
    this.searchQuery.set(undefined);

    this.isLoading.set(true);
    this.error.set('');
    try {
      const response = await this.trpc.chat.searchNotes.query(query);
      this.isLoading.set(false);
      this.response.set('');
      this.references.set([]);

      for await (const part of response as AsyncIterable<SearchNotesStreamItem>) {
        if (part.type === 'references') {
          this.references.set(part.references ?? []);
          continue;
        }

        if (part.type === 'data') {
          const content = part.message?.content;
          if (typeof content === 'string') {
            this.response.update(prev => prev + content);
          }
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        this.error.set(e.message);
      } else {
        this.error.set(String(e));
      }
      this.isLoading.set(false);
    }
  }
}
