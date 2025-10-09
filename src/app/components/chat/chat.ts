import { Component, inject, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Profile } from '../profile/profile';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { FormsModule } from '@angular/forms';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-chat',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    TextFieldModule,
    Profile,
    FormsModule,
    MarkdownComponent,
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  private readonly trpc = inject(TRPC_CLIENT);

  protected readonly searchQuery = signal<string | undefined>(undefined);
  protected readonly response = signal<string>('');
  protected readonly isLoading = signal(false);

  async searchNotes(event: Event) {
    event.preventDefault();
    const query = this.searchQuery();
    if (!query) return;
    this.searchQuery.set(undefined);

    this.isLoading.set(true);
    const response = await this.trpc.chat.searchNotes.query(query);
    this.isLoading.set(false);

    this.response.set('');
    for await (const part of response) {
      this.response.update(prev => prev + part.message.content);
    }
  }
}
