// src/app/app.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  NavigationEnd,
} from '@angular/router';
import { filter } from 'rxjs';

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
    CartPanelComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class AppComponent implements OnInit {
  year = new Date().getFullYear();

  currentUser: any = null;
  isLoggedIn = false;
  isAdmin = false;

  menuOpen = false;

  constructor(
    public cartUi: CartUiService,
    public cart: CartService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarSesion();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.cargarSesion();
        this.closeMenu();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

    window.addEventListener('storage', () => {
      this.cargarSesion();
    });
  }

  cargarSesion(): void {
    const user = this.auth.getCurrentUser();

    this.currentUser = user;
    this.isLoggedIn = !!user;
    this.isAdmin = user?.role === 'admin';
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  openCart(): void {
    this.cartUi.open();
  }

  get cartCount(): number {
    return this.cart.items().length;
  }

  logout(): void {
    const url = this.router.url;

    this.auth.logout();

    this.currentUser = null;
    this.isLoggedIn = false;
    this.isAdmin = false;
    this.closeMenu();

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