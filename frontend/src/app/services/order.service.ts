// src/app/services/order.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type OrderStatus =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'CANCELADO'
  | 'EN_PROCESO';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = 'https://multisegma-sac-production.up.railway.app/api/orders';

  constructor(private http: HttpClient) {}

  // Crear pedido desde el checkout o carrito
  create(body: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, body);
  }

  // Listar todos los pedidos para el administrador
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Obtener pedido por ID
  getById(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${orderId}`);
  }

  // Obtener pedidos del cliente por correo
  getByCustomerEmail(email: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/customer/${encodeURIComponent(email)}`
    );
  }

  // Obtener productos de un pedido
  getItems(orderId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${orderId}/items`);
  }

  // Cambiar estado del pedido desde el admin
  updateStatus(orderId: number, estado: OrderStatus): Observable<any> {
    const url = `${this.apiUrl}/${orderId}/estado?estado=${encodeURIComponent(
      estado
    )}`;

    return this.http.put<any>(url, {});
  }

  // Eliminar pedido si luego quieres usarlo desde el admin
  delete(orderId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${orderId}`);
  }
}