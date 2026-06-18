import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

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
  selectedCategory: string = 'TODOS';

categories = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PRODUCTO', label: 'Productos' },
  { value: 'SERVICIO', label: 'Servicios' },
];

  constructor(
    private productService: ProductService,
    private cart: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

 loadProducts(): void {
  this.loading = true;
  this.error = '';

  this.productService.getAll().subscribe({
    next: (rows) => {
      console.log('Productos desde backend:', rows);
      this.products = rows || [];
      this.loading = false;
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
  setCategory(category: string): void {
  this.selectedCategory = category;
}

categoryOf(product: Product): string {
  const category = (product.category || '').toLowerCase();
  const nombre = (product.nombre || '').toLowerCase();

  if (category.includes('servicio')) {
    return 'SERVICIO';
  }

  if (category.includes('producto')) {
    return 'PRODUCTO';
  }

  if (
    nombre.includes('mantenimiento') ||
    nombre.includes('software') ||
    nombre.includes('instalación') ||
    nombre.includes('instalacion')
  ) {
    return 'SERVICIO';
  }

  return 'PRODUCTO';
}

get filteredProducts(): Product[] {
  if (this.selectedCategory === 'TODOS') {
    return this.products;
  }

  return this.products.filter(
    (product) => this.categoryOf(product) === this.selectedCategory
  );
}

  verDetalle(product: Product): void {
    const id = (product as any).id || (product as any).productId || (product as any).idProducto;

    if (!id) {
      console.error('Producto sin ID:', product);
      return;
    }

    this.router.navigate(['/producto', id]);
  }

  imageFor(product: any): string {
    const name = (product?.nombre || product?.name || '').toLowerCase();

    const img = product?.imageUrl || product?.imagen;

    if (img) {
      if (
        img.startsWith('http://') ||
        img.startsWith('https://') ||
        img.startsWith('assets/')
      ) {
        return img;
      }

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