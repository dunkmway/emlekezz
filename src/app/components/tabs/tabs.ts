import { Component, input, model, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type TabOptions = {
  id: string;
  name: string;
  content: string;
};

export const currentNoteTab = {
  id: 'CURRENT_NOTE',
  name: 'Current Note',
  content: 'NO_CONTENT',
} as const;

@Component({
  selector: 'app-tabs',
  imports: [MatIconModule],
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
})
export class Tabs {
  readonly tabs = model.required<TabOptions[]>();
  readonly selectedTab = model.required<TabOptions>();

  protected readonly currentNoteTab = currentNoteTab;

  protected tabClosed(event: MouseEvent, tab: TabOptions) {
    event.stopPropagation();
    this.tabs.set(this.tabs().filter(filterTab => filterTab !== tab));
  }
}
