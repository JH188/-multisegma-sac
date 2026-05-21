import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Product {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  active?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProductRequest {
  name: string;
  price: number;
  description: string;
  imageUrl?: string | null;
  category?: string | null;
  active?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private API = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  // ==============================
  // NORMALIZAR PRODUCTO DEL BACKEND
  // ==============================
  private mapProduct(p: any): Product {
    return {
      id: p.id,
      nombre: p.name ?? p.nombre,
      descripcion: p.description ?? p.descripcion,
      precio: p.price ?? p.precio,
      imagen: p.imageUrl ?? p.imagen ?? null,
      imageUrl: p.imageUrl ?? null,
      category: p.category ?? null,
      active: p.active ?? true,
      createdAt: p.createdAt ?? null,
      updatedAt: p.updatedAt ?? null,
    };
  }

  // ==============================
  // CLIENTE: PRODUCTOS ACTIVOS
  // GET /api/products
  // ==============================
  getAll(): Observable<Product[]> {
    return this.http
      .get<any[]>(this.API)
      .pipe(map((data) => data.map((p) => this.mapProduct(p))));
  }

  // ==============================
  // ADMIN: TODOS LOS PRODUCTOS
  // GET /api/products/all
  // ==============================
  getAllForAdmin(): Observable<Product[]> {
    return this.http
      .get<any[]>(`${this.API}/all`)
      .pipe(map((data) => data.map((p) => this.mapProduct(p))));
  }

  // ==============================
  // ADMIN: CREAR PRODUCTO
  // POST /api/products
  // ==============================
  createProduct(data: ProductRequest): Observable<Product> {
    return this.http
      .post<any>(this.API, data)
      .pipe(map((p) => this.mapProduct(p)));
  }

  // ==============================
  // ADMIN: ACTUALIZAR PRODUCTO
  // PUT /api/products/{id}
  // ==============================
  updateProduct(id: number, data: ProductRequest): Observable<Product> {
    return this.http
      .put<any>(`${this.API}/${id}`, data)
      .pipe(map((p) => this.mapProduct(p)));
  }

  // ==============================
  // ADMIN: ACTUALIZAR SOLO PRECIO
  // ==============================
  updatePrice(id: number, nuevoPrecio: number): Observable<Product> {
    return this.http
      .put<any>(`${this.API}/${id}`, {
        price: nuevoPrecio,
      })
      .pipe(map((p) => this.mapProduct(p)));
  }

  // ==============================
  // ADMIN: ACTIVAR / DESACTIVAR
  // ==============================
  changeStatus(id: number, active: boolean): Observable<Product> {
    return this.http
      .put<any>(`${this.API}/${id}`, {
        active,
      })
      .pipe(map((p) => this.mapProduct(p)));
  }
}