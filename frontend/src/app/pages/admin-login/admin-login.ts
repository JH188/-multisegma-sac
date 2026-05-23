import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-login.html',
  styleUrls: ['./admin-login.scss']
})
export class AdminLoginComponent {
  email = 'admin@multisegma.com';
  password = '';
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ingresarAdmin(): void {
    this.error = '';

    const ok = this.auth.login(this.email.trim(), this.password.trim());

    if (!ok) {
      this.error = 'Credenciales de administrador incorrectas.';
      return;
    }

    if (!this.auth.isAdmin()) {
      this.auth.logoutAdmin();
      this.error = 'Esta cuenta no tiene permisos de administrador.';
      return;
    }

    this.router.navigate(['/admin']);
  }
}