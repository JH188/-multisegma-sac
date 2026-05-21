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
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  error = '';
  success = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  register(): void {
    this.error = '';
    this.success = '';

    const name = this.name.trim();
    const email = this.email.trim().toLowerCase();
    const password = this.password.trim();
    const confirmPassword = this.confirmPassword.trim();

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

    const created = this.auth.register(name, email, password);

    if (!created) {
      this.error = 'Este correo ya está registrado.';
      return;
    }

    this.success = 'Cuenta creada correctamente. Ahora inicia sesión.';

    setTimeout(() => {
      this.router.navigate(['/auth']);
    }, 1200);
  }

  goLogin(): void {
    this.router.navigate(['/auth']);
  }
}