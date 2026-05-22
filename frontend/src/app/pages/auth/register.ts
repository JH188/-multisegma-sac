import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  error = '';
  success = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  register(): void {
    this.error = '';
    this.success = '';

    const name = String(this.name || '').trim();
    const email = String(this.email || '').trim().toLowerCase();
    const password = String(this.password || '').trim();
    const confirmPassword = String(this.confirmPassword || '').trim();

    if (!name || !email || !password || !confirmPassword) {
      this.error = 'Completa todos los campos.';
      return;
    }

    if (!email.includes('@')) {
      this.error = 'Ingresa un correo válido.';
      return;
    }

    if (password.length < 6) {
      this.error = 'La contraseña debe tener mínimo 6 caracteres.';
      return;
    }

    if (password !== confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;

    this.auth.registerBackend(name, email, password).subscribe({
      next: (created) => {
        this.loading = false;

        if (!created) {
          this.error =
            'Ya existe una cuenta registrada con este correo. Inicia sesión.';
          return;
        }

        this.success =
          'Cuenta creada correctamente. Ya puedes consultar tus pedidos.';

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 500);
      },
      error: (err) => {
        console.error('Error al registrar usuario:', err);
        this.loading = false;
        this.error = 'No se pudo crear la cuenta. Intenta nuevamente.';
      },
    });
  }

  goLogin(): void {
    this.router.navigate(['/auth']);
  }
}