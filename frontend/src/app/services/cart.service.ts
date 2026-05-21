import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService, User } from './auth.service';

export interface CartItem {
  id: number | string;
  productId?: number | null;
  name: string;
  price: number;
  qty: number;
}

export interface CheckoutData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  referencia: string;

  paymentMethod: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  // Si tienes proxy.conf.json, deja /api.
  // Si NO usas proxy, cambia por: https://multisegma-sac-production.up.railway.app/api
  private base = 'https://multisegma-sac-production.up.railway.app/api';

  private _items = signal<CartItem[]>([]);

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.loadFromStorageForCurrentUser();
  }

  // ============================================================
  // CLAVES POR USUARIO
  // ============================================================

  private storageKeyForCart(user: User | null): string {
    const email = user?.email?.toLowerCase() || 'guest';
    return `multisegma_cart_${email}`;
  }

  private storageKeyForLastOrder(user: User | null): string {
    const email = user?.email?.toLowerCase() || 'guest';
    return `multisegma_last_order_${email}`;
  }

  private get currentCartKey(): string {
    const user = this.auth.getCurrentUser();
    return this.storageKeyForCart(user);
  }

  private get currentLastOrderKey(): string {
    const user = this.auth.getCurrentUser();
    return this.storageKeyForLastOrder(user);
  }

  // ============================================================
  // CARGAR Y GUARDAR CARRITO
  // ============================================================

  public loadFromStorageForCurrentUser(): void {
    const raw = localStorage.getItem(this.currentCartKey);

    if (!raw) {
      this._items.set([]);
      return;
    }

    try {
      const data = JSON.parse(raw);

      if (!Array.isArray(data)) {
        this._items.set([]);
        return;
      }

      this._items.set(
        data.map((it: any) => ({
          id: it.id,
          productId: it.productId ?? Number(it.id) ?? null,
          name: it.name,
          price: Number(it.price || 0),
          qty: Number(it.qty || 1),
        }))
      );
    } catch (error) {
      console.error('Error leyendo carrito:', error);
      this._items.set([]);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.currentCartKey, JSON.stringify(this._items()));
    } catch (error) {
      console.error('Error guardando carrito:', error);
    }
  }

  // ============================================================
  // MÉTODOS DEL CARRITO
  // ============================================================

  items(): CartItem[] {
    return this._items();
  }

  count(): number {
    return this._items().reduce((sum, item) => sum + item.qty, 0);
  }

  total(): number {
    return this._items().reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  add(product: any): void {
    const arr = [...this._items()];

    const id = product.id ?? product.productId ?? product.codigo ?? product.nombre ?? product.name;
    const productId = Number(product.id ?? product.productId ?? 0) || null;
    const name = product.name ?? product.nombre ?? 'Producto / Servicio';
    const price = Number(product.price ?? product.precio ?? 0);

    const index = arr.findIndex((item) => item.id === id);

    if (index >= 0) {
      arr[index] = {
        ...arr[index],
        qty: arr[index].qty + 1,
      };
    } else {
      arr.push({
        id,
        productId,
        name,
        price,
        qty: 1,
      });
    }

    this._items.set(arr);
    this.saveToStorage();
  }

  increase(index: number): void {
    const arr = [...this._items()];
    const item = arr[index];

    if (!item) return;

    arr[index] = {
      ...item,
      qty: item.qty + 1,
    };

    this._items.set(arr);
    this.saveToStorage();
  }

  decrease(index: number): void {
    const arr = [...this._items()];
    const item = arr[index];

    if (!item) return;

    if (item.qty > 1) {
      arr[index] = {
        ...item,
        qty: item.qty - 1,
      };
    } else {
      arr.splice(index, 1);
    }

    this._items.set(arr);
    this.saveToStorage();
  }

  remove(index: number): void {
    const arr = [...this._items()];

    if (index < 0 || index >= arr.length) return;

    arr.splice(index, 1);
    this._items.set(arr);
    this.saveToStorage();
  }

  clear(): void {
    this._items.set([]);
    this.saveToStorage();
  }

  // ============================================================
  // ÚLTIMO PEDIDO / VOUCHER
  // ============================================================

  saveLastOrder(order: any): void {
    try {
      localStorage.setItem(this.currentLastOrderKey, JSON.stringify(order));
    } catch (error) {
      console.error('No se pudo guardar último pedido:', error);
    }
  }

  getLastOrder(): any | null {
    try {
      const raw = localStorage.getItem(this.currentLastOrderKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('No se pudo leer último pedido:', error);
      return null;
    }
  }

  // ============================================================
  // CHECKOUT AL BACKEND
  // POST /api/orders
  // ============================================================

  checkout(data: CheckoutData): Observable<any> {
    const payload = {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,

      departamento: data.departamento,
      provincia: data.provincia,
      distrito: data.distrito,
      direccion: data.direccion,
      referencia: data.referencia,

      paymentMethod: data.paymentMethod,
      total: this.total(),

      items: this.items().map((item) => ({
        productId: item.productId,
        nombre: item.name,
        cantidad: item.qty,
        precio: item.price,
        subtotal: item.price * item.qty,
      })),
    };

    return this.http.post<any>(`${this.base}/orders`, payload);
  }
}