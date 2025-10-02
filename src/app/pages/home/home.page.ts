import { Component, inject, signal } from '@angular/core';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { Chat } from '../../components/chat/chat';
import { Note } from '../../components/note/note';

@Component({
  selector: 'app-home',
  imports: [Chat, Note],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  trpc = inject(TRPC_CLIENT);

  contentValue = signal<string | null | undefined>(undefined);
}
