import { Component, effect, viewChild } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Chat } from '../../components/chat/chat';
import { Note } from '../../components/note/note';
import { Menu } from '../../components/menu/menu';

@Component({
  selector: 'app-home',
  imports: [Chat, Note, Menu, MatSidenavModule],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly noteComponent = viewChild(Note);

  noteClicked(id: string) {
    this.noteComponent()?.addNoteTab(id);
  }
}
