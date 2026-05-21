// src/app/checkout/checkout.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss']
})
export class CheckoutComponent implements OnInit {

  // 🔒 Clave para localStorage
  private readonly CHECKOUT_STATE_KEY = 'lisume_checkout_state';

  // Paso actual del flujo
  paso: 'datos' | 'wallet' | 'qr' | 'exito' = 'datos';

  // Datos del cliente
  datosCliente = {
    nombre: '',
    email: '',
    telefono: ''
  };

  // Datos de envío
  datosEnvio = {
    departamento: '',
    provincia: '',
    distrito: '',
    direccion: '',
    referencia: ''
  };

  // Método de pago (solo Yape en este flujo)
  metodoPago: 'Yape' | 'Transferencia' | 'Tarjeta' | '' = '';

  // Datos de billetera
  wallet = {
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    celular: ''
  };

  // Yape / Plin elegido
  billeteraSeleccionada: 'Yape' | 'Plin' | null = null;

  // Indicador de espera de pago
  esperandoPago = false;

  // Datos del comprobante
  voucher: {
    codigo: string;
    fecha: Date;
    metodo: string;
    total: number;
    nombre: string;
    estado: string;
    orderId?: number;
  } | null = null;

  constructor(
    public cart: CartService,
    private router: Router,
    private orders: OrderService
  ) {}

  // =====================================================
  //  INICIO: restaurar estado guardado
  // =====================================================
  ngOnInit(): void {
    this.restoreState();
  }

  // Guardar en localStorage
  private saveState(): void {
    const state = {
      paso: this.paso,
      datosCliente: this.datosCliente,
      datosEnvio: this.datosEnvio,
      metodoPago: this.metodoPago,
      wallet: this.wallet,
      billeteraSeleccionada: this.billeteraSeleccionada
    };

    try {
      localStorage.setItem(this.CHECKOUT_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('No se pudo guardar el estado del checkout', e);
    }
  }

  // Restaurar desde localStorage + refrescar estado del pedido
  private restoreState(): void {
    const raw = localStorage.getItem(this.CHECKOUT_STATE_KEY);
    if (!raw) return;

    try {
      const state = JSON.parse(raw);

      this.datosCliente = state.datosCliente ?? this.datosCliente;
      this.datosEnvio   = state.datosEnvio   ?? this.datosEnvio;
      this.metodoPago   = state.metodoPago   ?? '';
      this.wallet       = state.wallet       ?? this.wallet;
      this.billeteraSeleccionada = state.billeteraSeleccionada ?? null;

      if (state.paso === 'exito') {
        const last = this.cart.getLastOrder();
        if (last) {
          const estadoInicial = last.estado ?? 'Pago pendiente de confirmación';

          this.voucher = {
            codigo: last.codigo,
            fecha: new Date(last.fecha),
            metodo: last.metodo,
            total: last.total,
            nombre: last.nombre,
            estado: estadoInicial,
            orderId: last.orderId
          };

          this.paso = 'exito';

          // 👇 Intentamos refrescar estado desde el backend si hay orderId
          if (last.orderId) {
            this.orders.getById(last.orderId).subscribe({
              next: (order) => {
                if (!this.voucher) return;
                const nuevoEstado = order?.estado || this.voucher.estado;
                this.voucher.estado = nuevoEstado;

                // Actualizamos también el "lastOrder" guardado
                this.cart.saveLastOrder({
                  ...last,
                  estado: nuevoEstado
                });
              },
              error: () => {
                // si falla, nos quedamos con el estado que teníamos
              }
            });
          }
        } else {
          this.paso = 'datos';
        }
      } else {
        this.paso = state.paso ?? 'datos';
      }
    } catch (e) {
      console.error('No se pudo restaurar el estado del checkout', e);
    }
  }

  // Limpiar estado
  private clearState(): void {
    localStorage.removeItem(this.CHECKOUT_STATE_KEY);
  }

  // ================== Helpers del carrito ==================
  get items() { return this.cart.items(); }
  get total()  { return this.cart.total(); }

  imageFor(it: any): string {
    const id = it.id;
    switch (id) {
      case 1: return 'assets/lisume/tintas-para-impresora.jpeg';
      case 2: return 'assets/lisume/tonners.jpeg';
      case 3: return 'assets/lisume/mecanizado-cnc.png';
      case 4: return 'assets/lisume/mantenimiento.jpeg';
      default: return 'assets/lisume/software.jpeg';
    }
  }

  // ========= Texto y clase CSS del estado del voucher =========
  get estadoTexto(): string {
    const estado = (this.voucher?.estado || '').toUpperCase();

    switch (estado) {
      case 'CONFIRMADO':
        return 'Pago confirmado';
      case 'CANCELADO':
        return 'Pago cancelado';
      default:
        return 'Pago pendiente de confirmación';
    }
  }

  get estadoClase(): string {
    const estado = (this.voucher?.estado || '').toUpperCase();

    switch (estado) {
      case 'CONFIRMADO':
        return 'badge-confirmed';
      case 'CANCELADO':
        return 'badge-cancelled';
      default:
        return 'badge-pending';
    }
  }

  // ================= PASO 1 =================
  Continuar(form: NgForm) {
    if (form.invalid || !this.items.length || !this.metodoPago) return;

    this.wallet.celular = this.datosCliente.telefono;
    this.paso = 'wallet';
    this.saveState();
  }

  // ================= PASO 2 =================
  seleccionarWallet(tipo: 'Yape' | 'Plin') {
    this.billeteraSeleccionada = tipo;
    this.saveState();
  }

  volverADatos() {
    this.paso = 'datos';
    this.saveState();
  }

  irAPagoQR() {
    if (!this.billeteraSeleccionada) {
      alert('Elige Yape o Plin antes de continuar.');
      return;
    }
    if (!this.wallet.numeroDocumento || !this.wallet.celular) {
      alert('Completa documento y celular para continuar.');
      return;
    }

    this.esperandoPago = false;
    this.paso = 'qr';
    this.saveState();
  }

  // ================= PASO 3: CONFIRMAR PAGO =================
  confirmarPago() {
    if (!this.billeteraSeleccionada) return;

    this.esperandoPago = true;

    const totalActual = this.total;
    const itemsSnapshot = this.items.map((it: any) => ({ ...it }));

 const body = {
  customerName: this.datosCliente.nombre,
  customerEmail: this.datosCliente.email,
  customerPhone: this.datosCliente.telefono,

  departamento: this.datosEnvio.departamento || '',
  provincia: this.datosEnvio.provincia || this.datosEnvio.departamento || '',
  distrito: this.datosEnvio.distrito || '',
  direccion: this.datosEnvio.direccion || '',
  referencia: this.datosEnvio.referencia || '',

  paymentMethod: `${this.metodoPago} - ${this.billeteraSeleccionada}`,
  total: totalActual,

  items: itemsSnapshot.map((it: any) => ({
    productId: it.id || null,
    nombre: it.name || it.title || it.nombre || 'Producto',
    cantidad: it.qty || it.quantity || 1,
    precio: it.price || it.precio || 0,
    subtotal: (it.price || it.precio || 0) * (it.qty || it.quantity || 1)
  }))
};
    this.orders.create(body).subscribe({
      next: (res: any) => {
        this.esperandoPago = false;

        const codigo = res?.id
          ? `LIS-${res.id.toString().padStart(4, '0')}`
          : `LIS-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

        const fechaComprobante = res?.fechaRegistro
          ? new Date(res.fechaRegistro)
          : new Date();

        this.voucher = {
          codigo,
          fecha: fechaComprobante,
          metodo: `${this.metodoPago} / ${this.billeteraSeleccionada}`,
          total: totalActual,
          nombre: this.datosCliente.nombre,
          estado: res?.estado || 'PENDIENTE',
          orderId: res?.id
        };

        // Guardamos también como "último pedido"
        this.cart.saveLastOrder({
          ...this.voucher,
          items: itemsSnapshot
        });

        this.paso = 'exito';
        this.saveState();
      },
      error: (err) => {
        console.error('Error guardando pedido', err);
        this.esperandoPago = false;
        alert('Ocurrió un problema registrando el pedido 🥲');
      }
    });
  }

  cancelarPago() {
    this.paso = 'wallet';
    this.saveState();
  }

  // ================= PASO 4: VOLVER AL INICIO =================
  volverAlInicio() {
    this.cart.clear();
    this.clearState();
    this.router.navigate(['/']);
  }
}
