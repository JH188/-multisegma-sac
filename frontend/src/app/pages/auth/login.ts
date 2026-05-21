import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  // formulario normal de login
  email = '';
  password = '';
  error = '';

  // ===== MODAL ADMIN =====
  showAdminModal = false;
  adminEmail = '';
  adminPassword = '';
  adminError = '';

  constructor(
    private auth: AuthService,
    private cart: CartService,
    private router: Router
  ) {}

  goRegister(): void {
    this.router.navigate(['/register']);
  }

  // login normal (usuarios)
  onSubmit(): void {
    this.error = '';

    if (!this.email || !this.password) {
      this.error = 'Ingresa tu correo y contraseña.';
      return;
    }

    const ok = this.auth.login(this.email, this.password);

    if (!ok) {
      this.error = 'Credenciales incorrectas.';
      return;
    }

    // 👉 cargar carrito propio de este usuario
    this.cart.loadFromStorageForCurrentUser();

    // si todo ok -> al inicio
    this.router.navigate(['/']);
  }

  // ====== ADMIN: abrir / cerrar modal ======
  openAdminModal(): void {
    this.adminError = '';
    this.adminEmail = '';
    this.adminPassword = '';
    this.showAdminModal = true;
  }

  closeAdminModal(): void {
    this.showAdminModal = false;
  }

  // envío del formulario de ADMIN
  submitAdmin(): void {
    this.adminError = '';

    if (!this.adminEmail || !this.adminPassword) {
      this.adminError = 'Completa correo y contraseña.';
      return;
    }

    const ok = this.auth.login(this.adminEmail, this.adminPassword);

    if (!ok) {
      this.adminError = 'Credenciales de administrador incorrectas.';
      return;
    }

    // 👉 también cargamos el carrito del admin (si tuviera)
    this.cart.loadFromStorageForCurrentUser();

    alert('👑 Bienvenido Administrador');
    this.showAdminModal = false;
    this.router.navigate(['/admin']);
  }
}
