import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  auth = inject(AuthService);

  username = signal('');
  password = signal('');
  error = signal('');

  async login() {
    this.error.set('');
    const response = await fetch(location.origin + '/sys/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: this.username(),
        password: this.password(),
      }),
    });

    if (response.ok) {
      window.location.href = '/login';
    } else if (response.status === 400) {
      this.error.set('Missing username or password');
    } else {
      this.error.set('Failed to login');
    }
  }
}
