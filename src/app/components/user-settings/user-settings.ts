import { Component, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { UserNotes } from '../user-notes/user-notes';
import { UserModels } from '../user-models/user-models';
import { UserProfile } from '../user-profile/user-profile';

type Tab = 'Profile' | 'Models' | 'Notes';

@Component({
  selector: 'app-user-settings',
  imports: [MatDialogModule, MatButton, UserNotes, UserModels, UserProfile],
  templateUrl: './user-settings.html',
  styleUrl: './user-settings.scss',
})
export class UserSettings {
  protected readonly currentTab = signal<Tab>('Profile');
}
