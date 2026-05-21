import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h2>Carrito</h2>

    <div class="card" *ngIf="cart.items().length === 0">
      <p>Tu carrito está vacío.</p>
      <a routerLink="/" class="btn">Ver productos</a>
    </div>

    <div *ngIf="cart.items().length > 0" class="card">
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th>Precio</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr *ngFor="let it of cart.items(); let i = index">
            <td>{{ it.name }}</td>
            <td>{{ it.qty }}</td>
            <td>S/ {{ it.price | number:'1.2-2' }}</td>
            <td>S/ {{ (it.price * it.qty) | number:'1.2-2' }}</td>
            <td>
              <button class="btn" type="button" (click)="cart.remove(i)">
                Quitar
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p style="text-align:right">
        <b>Total:</b> S/ {{ cart.total() | number:'1.2-2' }}
      </p>

      <button class="btn primary" type="button" (click)="checkout()">
        Enviar pedido de prueba
      </button>

      <p *ngIf="msg" style="color:green">{{ msg }}</p>
      <p *ngIf="err" style="color:crimson">{{ err }}</p>
    </div>
  `
})
export class CartComponent {
  msg = '';
  err = '';

  constructor(public cart: CartService) {}

  checkout(): void {
    this.msg = '';
    this.err = '';

    this.cart.checkout({
      customerName: 'Cliente de prueba',
      customerEmail: 'cliente@correo.com',
      customerPhone: '999888777',

      departamento: 'Lima',
      provincia: 'Lima',
      distrito: 'Los Olivos',
      direccion: 'Av. Universitaria 123',
      referencia: 'Frente a una tienda',

      paymentMethod: 'Yape'
    }).subscribe({
      next: (res: any) => {
        this.msg = 'Pedido enviado correctamente';
        this.cart.saveLastOrder(res);
        this.cart.clear();
      },
      error: (e: any) => {
        console.error('Error enviando pedido:', e);
        this.err = e?.error?.message || e.message || 'Error al enviar pedido';
      }
    });
  }
}