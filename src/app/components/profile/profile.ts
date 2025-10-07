import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AdminSettings } from '../admin-settings/admin-settings';
import { UserSettings } from '../user-settings/user-settings';

@Component({
  selector: 'app-profile',
  imports: [MatButtonModule, MatMenuModule, MatIconModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  protected readonly auth = inject(AuthService);
  protected readonly dialog = inject(MatDialog);

  openAdminSettingsDialog() {
    this.dialog.open(AdminSettings, {
      panelClass: 'fullscreen',
    });
  }

  openUserSettingsDialog() {
    this.dialog.open(UserSettings, {
      panelClass: 'fullscreen',
    });
  }
}
