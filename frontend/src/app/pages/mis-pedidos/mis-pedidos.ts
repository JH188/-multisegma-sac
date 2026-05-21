import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.scss',
})
export class MisPedidosComponent implements OnInit {
  loading = true;
  error = '';
  user: any = null;
  pedidos: any[] = [];

  constructor(
    private auth: AuthService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();

    if (!this.user?.email) {
      this.loading = false;
      this.error = 'Debes iniciar sesión para ver tus pedidos.';
      return;
    }

    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.loading = true;
    this.error = '';

    this.orderService.getByCustomerEmail(this.user.email).subscribe({
      next: (res) => {
        this.pedidos = res || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar tus pedidos.';
        this.loading = false;
      },
    });
  }

  estadoClase(status: string): string {
    const estado = (status || '').toUpperCase();

    if (estado === 'CONFIRMADO') return 'confirmado';
    if (estado === 'CANCELADO') return 'cancelado';
    if (estado === 'EN PROCESO') return 'proceso';
    return 'pendiente';
  }

  formatoFecha(fecha: string): string {
    if (!fecha) return '-';

    return new Date(fecha).toLocaleString('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }
}