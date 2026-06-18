import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent {
  email = '';
  newPassword = '';
  confirmPassword = '';

  loading = false;
  error = '';
  success = '';

  constructor(private authService: AuthService, private router: Router) {}

  resetPassword(): void {
    this.error = '';
    this.success = '';

    if (!this.email.trim()) {
      this.error = 'Ingresa tu correo electrónico.';
      return;
    }

    if (!this.newPassword.trim()) {
      this.error = 'Ingresa una nueva contraseña.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'La contraseña debe tener mínimo 6 caracteres.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;

    this.authService.resetPassword(this.email, this.newPassword).subscribe({
      next: (ok) => {
        this.loading = false;

        if (!ok) {
          this.error = 'No existe una cuenta registrada con ese correo.';
          return;
        }

        this.success = 'Contraseña actualizada correctamente. Ahora puedes iniciar sesión.';

        setTimeout(() => {
          this.router.navigate(['/auth']);
        }, 1500);
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo restablecer la contraseña.';
      },
    });
  }
}