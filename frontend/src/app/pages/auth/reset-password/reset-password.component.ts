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
  step: 1 | 2 = 1;

  email = '';
  code = '';
  newPassword = '';
  confirmPassword = '';

  loading = false;
  error = '';
  success = '';

  constructor(private authService: AuthService, private router: Router) {}

  sendCode(): void {
    this.error = '';
    this.success = '';

    if (!this.email.trim()) {
      this.error = 'Ingresa tu correo electrónico.';
      return;
    }

    if (!this.email.includes('@')) {
      this.error = 'Ingresa un correo válido.';
      return;
    }

    this.loading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.loading = false;
        this.success =
          res?.message || 'Si el correo está registrado, recibirás un código.';
        this.step = 2;
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message || 'No se pudo enviar el código de recuperación.';
      },
    });
  }

  resetPassword(): void {
    this.error = '';
    this.success = '';

    if (!this.code.trim()) {
      this.error = 'Ingresa el código que llegó a tu correo.';
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

    this.authService
      .resetPasswordWithCode(this.email, this.code, this.newPassword)
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.success =
            res?.message || 'Contraseña actualizada correctamente.';

          setTimeout(() => {
            this.router.navigate(['/auth']);
          }, 1800);
        },
        error: (err) => {
          this.loading = false;
          this.error =
            err?.error?.message ||
            'No se pudo restablecer la contraseña. Verifica el código.';
        },
      });
  }

  backToEmail(): void {
    this.step = 1;
    this.code = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.error = '';
    this.success = '';
  }
}