import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CartService } from '../services/cart.service';
import { CartUiService } from '../services/cart-ui.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-cart-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart-panel.html',
  styleUrls: ['./cart-panel.scss']
})
export class CartPanelComponent {

  checkoutPaso: 'resumen' | 'datos' | 'pago' | 'espera' | 'exito' = 'resumen';

  metodoPago: 'Yape' | 'Plin' | 'Transferencia' | 'Tarjeta' = 'Yape';

  datosEnvio = {
    nombre: '',
    email: '',
    telefono: '',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: '',
    direccion: '',
    referencia: ''
  };

  constructor(
    public cart: CartService,
    public ui: CartUiService,
    private auth: AuthService,
    private router: Router
  ) {}

  get items() {
    return this.cart.items();
  }

  get total() {
    return this.cart.total();
  }

  close(): void {
    this.ui.close();
  }

  addOne(index: number): void {
    const item: any = this.items[index];

    if (item) {
      this.cart.add(item);
    }
  }

  removeOne(index: number): void {
    this.cart.decrease(index);
  }

  selectPayment(m: string): void {
    this.metodoPago = m as any;
  }

  // Botón para ir a página checkout
  irACheckout(): void {
    if (!this.items.length) return;

    if (!this.auth.isLoggedIn()) {
      this.ui.close();
      this.router.navigate(['/auth']);
      return;
    }

    this.ui.close();
    this.router.navigate(['/checkout']);
  }

  // Paso 1: resumen → datos
  irADatosEnvio(): void {
    if (!this.items.length) return;

    // Si el cliente no está logueado, primero debe ingresar o registrarse
    if (!this.auth.isLoggedIn()) {
      this.ui.close();
      this.router.navigate(['/auth']);
      return;
    }

    this.checkoutPaso = 'datos';
  }

  // Paso 2: datos → pago
  irAFormaPago(): void {
    if (!this.datosEnvio.nombre.trim()) {
      alert('Ingresa tu nombre o razón social.');
      return;
    }

    if (!this.datosEnvio.email.trim()) {
      alert('Ingresa tu correo.');
      return;
    }

    if (!this.datosEnvio.telefono.trim()) {
      alert('Ingresa tu teléfono.');
      return;
    }

    if (!this.datosEnvio.direccion.trim()) {
      alert('Ingresa tu dirección.');
      return;
    }

    this.checkoutPaso = 'pago';
  }

  // Paso 3: pago → espera
  confirmarMetodoPago(): void {
    if (!this.metodoPago) return;
    this.checkoutPaso = 'espera';
  }

  // Paso 4: guardar pedido
  simularPagoExitoso(): void {
    this.guardarPedido();
  }

  private guardarPedido(): void {
    this.cart.checkout({
      customerName: this.datosEnvio.nombre,
      customerEmail: this.datosEnvio.email,
      customerPhone: this.datosEnvio.telefono,

      departamento: this.datosEnvio.departamento || 'Lima',
      provincia: this.datosEnvio.provincia || 'Lima',
      distrito: this.datosEnvio.distrito || 'Sin distrito',
      direccion: this.datosEnvio.direccion,
      referencia: this.datosEnvio.referencia || '',

      paymentMethod: this.metodoPago
    }).subscribe({
      next: (order) => {
        this.cart.saveLastOrder(order);
        this.checkoutPaso = 'exito';
      },
      error: (err) => {
        console.error('Error guardando pedido', err);
        alert('Ocurrió un problema guardando el pedido.');
      }
    });
  }

  cerrarCarrito(): void {
    this.cart.clear();
    this.checkoutPaso = 'resumen';
    this.close();
  }
}