// src/app/pages/orders/orders.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.html',
  styleUrls: ['./orders.scss']
})
export class OrdersComponent implements OnInit {
  lastOrder: any | null = null;
  loading = false;

  constructor(
    private cart: CartService,
    private ordersApi: OrderService
  ) {}

  ngOnInit(): void {
    const local = this.cart.getLastOrder();
    if (!local) {
      return;
    }

    this.lastOrder = local;

    // 👇 Muy importante: usamos el id del pedido que guardamos en el checkout
    if (local.orderId) {
      this.loading = true;
      this.ordersApi.getById(local.orderId).subscribe({
        next: (serverOrder) => {
          if (serverOrder) {
            // Actualizamos el estado (y si quieres también total, fecha, etc.)
            this.lastOrder = {
              ...this.lastOrder,
              estado: serverOrder.estado,
              total: serverOrder.total ?? this.lastOrder.total,
              fecha: serverOrder.fechaRegistro ?? this.lastOrder.fecha
            };
            // Guardamos de nuevo en localStorage
            this.cart.saveLastOrder(this.lastOrder);
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('No se pudo sincronizar el estado del pedido', err);
          this.loading = false;
        }
      });
    }
  }

  get hasOrder(): boolean {
    return !!this.lastOrder;
  }

  // Texto que verá el cliente en el badge
  get estadoTexto(): string {
    if (!this.lastOrder) return '';

    switch (this.lastOrder.estado) {
      case 'CONFIRMADO':
        return 'Pago confirmado';
      case 'CANCELADO':
        return 'Pago cancelado por LISUME';
      default:
        // PENDIENTE u otro
        return 'Pago pendiente de confirmación';
    }
  }

  // Clase CSS para el color del badge
  get estadoClase(): string {
    if (!this.lastOrder) return 'badge-pending';

    switch (this.lastOrder.estado) {
      case 'CONFIRMADO':
        return 'badge-confirmed';
      case 'CANCELADO':
        return 'badge-cancelled';
      default:
        return 'badge-pending';
    }
  }

  // Botón "Cancelar pedido" solo afecta al cliente (no toca el backend)
  cancelarPedido(): void {
    if (!this.lastOrder) return;
    this.lastOrder = {
      ...this.lastOrder,
      estado: 'Cancelado por el cliente'
    };
    this.cart.saveLastOrder(this.lastOrder);
  }

  imageFor(it: any): string {
    switch (it.id) {
      case 1: return 'assets/lisume/tintas-para-impresora.jpeg';
      case 2: return 'assets/lisume/tonners.jpeg';
      case 3: return 'assets/lisume/mantenimiento.jpeg';
      case 4: return 'assets/lisume/software.jpeg';
      default: return 'assets/lisume/portal-multisegma.jpeg';
    }
  }
}
