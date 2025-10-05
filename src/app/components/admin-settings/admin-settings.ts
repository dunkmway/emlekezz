import { Component, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { Users } from '../users/users';
import { Models } from '../models/models';

type Tab = 'Users' | 'Models';

@Component({
  selector: 'app-admin-settings',
  imports: [MatDialogModule, MatButton, Users, Models],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.scss',
})
export class AdminSettings {
  protected readonly currentTab = signal<Tab>('Users');
}
