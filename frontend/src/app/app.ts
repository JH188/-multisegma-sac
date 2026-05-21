// src/app/app.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { CartUiService } from './services/cart-ui.service';
import { CartPanelComponent } from './cart-panel/cart-panel';
import { CartService } from './services/cart.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CartPanelComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  year = new Date().getFullYear();

  constructor(
    public cartUi: CartUiService,
    public cart: CartService,
    public auth: AuthService,
    private router: Router
  ) {}

  openCart(): void {
    this.cartUi.open();
  }

  get cartCount(): number {
    return this.cart.items().length;
  }

  logout(): void {
    const url = this.router.url;

    this.auth.logout();

    if (url.startsWith('/admin')) {
      this.router.navigate(['/admin-login']);
    } else {
      this.router.navigate(['/auth']);
    }
  }

  isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }

  isAdminLoginRoute(): boolean {
    return this.router.url.startsWith('/admin-login');
  }

  isAuthRoute(): boolean {
    return this.router.url.startsWith('/auth');
  }

  isRegisterRoute(): boolean {
    return this.router.url.startsWith('/register');
  }

  isPublicFormRoute(): boolean {
    return (
      this.isAuthRoute() ||
      this.isRegisterRoute() ||
      this.isAdminLoginRoute() ||
      this.isAdminRoute()
    );
  }
}