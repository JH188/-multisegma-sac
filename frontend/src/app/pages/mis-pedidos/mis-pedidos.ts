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
    this.cargarUsuarioYPedidos();
  }

  cargarUsuarioYPedidos(): void {
    this.loading = true;
    this.error = '';

    const currentUser = this.auth.getCurrentUser();

    if (!currentUser || !currentUser.email) {
      this.user = null;
      this.pedidos = [];
      this.loading = false;
      this.error = 'Debes iniciar sesión para ver tus pedidos.';
      return;
    }

    this.user = {
      ...currentUser,
      email: String(currentUser.email).trim().toLowerCase(),
    };

    this.cargarPedidos();
  }

cargarPedidos(): void {
  if (!this.user?.email) {
    this.loading = false;
    this.error = 'No se encontró el correo del usuario.';
    return;
  }

  this.loading = true;
  this.error = '';

  const emailUsuario = String(this.user.email).trim().toLowerCase();

  this.orderService.getAll().subscribe({
    next: (res: any[]) => {
      const data = res || [];

      this.pedidos = data
        .filter((pedido: any) => {
          const correoPedido = String(
            pedido?.correo ||
            pedido?.email ||
            pedido?.customerEmail ||
            pedido?.clienteCorreo ||
            pedido?.cliente?.correo ||
            pedido?.cliente?.email ||
            ''
          )
            .trim()
            .toLowerCase();

          return correoPedido === emailUsuario;
        })
        .sort((a: any, b: any) => {
          const fechaA = new Date(a.createdAt || a.fecha || 0).getTime();
          const fechaB = new Date(b.createdAt || b.fecha || 0).getTime();
          return fechaB - fechaA;
        });

      this.loading = false;
    },
    error: (err) => {
      console.error('Error cargando pedidos del usuario:', err);
      this.pedidos = [];
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

  private parseDatePeru(value: any): Date | null {
  if (!value) return null;

  let text = String(value).trim();

  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text) &&
    !text.endsWith('Z') &&
    !/[+-]\d{2}:\d{2}$/.test(text)
  ) {
    text = text + 'Z';
  }

  const date = new Date(text);
  return isNaN(date.getTime()) ? null : date;
}

formatoFecha(fecha: string): string {
  const date = this.parseDatePeru(fecha);
  if (!date) return '-';

  return date.toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
}