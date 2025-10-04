import { Component, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type TabOptions = {
  id: string;
  name: string;
  content: string;
};

@Component({
  selector: 'app-tabs',
  imports: [MatIconModule],
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
})
export class Tabs {
  readonly tabs = model.required<TabOptions[]>();
  readonly selectedTabIndex = model.required<number>();

  protected tabClosed(event: MouseEvent, tabIndex: number) {
    event.stopPropagation();
    if (this.selectedTabIndex() === this.tabs().length - 1) {
      this.selectedTabIndex.update(index => index - 1);
    }
    this.tabs.update(tabs => {
      tabs.splice(tabIndex, 1);
      return tabs;
    });
  }
}
