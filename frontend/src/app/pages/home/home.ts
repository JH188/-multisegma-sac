// src/app/pages/home/home.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  loading = false;
  error = '';

  constructor(
    private productService: ProductService,
    private cart: CartService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';

    this.productService.getAll().subscribe({
      next: (rows) => {
        this.products = rows || [];
      },
      error: (e) => {
        console.error('Error cargando productos:', e);
        this.error =
          'No se pudieron cargar los productos. Verifica que el backend esté encendido.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  add(product: Product): void {
    this.cart.add(product);
  }

 imageFor(product: any): string {
  const name = (product?.nombre || product?.name || '').toLowerCase();

  const img = product?.imageUrl || product?.imagen;

  if (img) {
    // Si ya viene con ruta completa o assets, la respeta
    if (
      img.startsWith('http://') ||
      img.startsWith('https://') ||
      img.startsWith('assets/')
    ) {
      return img;
    }

    // Si viene solo el nombre del archivo desde MySQL/backend,
    // le agregamos la carpeta correcta
    return `assets/lisume/${img}`;
  }

  if (name.includes('tinta')) {
    return 'assets/lisume/tintas-para-impresora.jpeg';
  }

  if (name.includes('tonner') || name.includes('toner')) {
    return 'assets/lisume/tonners.jpeg';
  }

  if (name.includes('mantenimiento')) {
    return 'assets/lisume/mantenimiento.jpeg';
  }

  if (
    name.includes('software') ||
    name.includes('instalación') ||
    name.includes('instalacion')
  ) {
    return 'assets/lisume/software.jpeg';
  }

  return 'assets/lisume/portal-multisegma.jpeg';
}
}