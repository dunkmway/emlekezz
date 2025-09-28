import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  auth = inject(AuthService);
}
