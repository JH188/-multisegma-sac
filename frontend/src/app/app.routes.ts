import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home';
import { ContactComponent } from './pages/contact/contact';
import { AdminComponent } from './pages/admin/admin';
import { AdminLoginComponent } from './pages/admin-login/admin-login';
import { CartComponent } from './pages/cart';
import { AuthComponent } from './pages/auth/auth';
import { RegisterComponent } from './pages/auth/register';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CheckoutComponent } from './checkout/checkout';

export const routes: Routes = [
  // Página pública principal
  { path: '', component: HomeComponent },

  // Cliente
  { path: 'auth', component: AuthComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'contacto', component: ContactComponent },

  // Admin login separado
  { path: 'admin-login', component: AdminLoginComponent },

  // Carrito y checkout protegidos para cliente
  { path: 'carrito', component: CartComponent, canActivate: [AuthGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard] },

  // Panel administrador protegido
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },

  { path: '**', redirectTo: '' }
];