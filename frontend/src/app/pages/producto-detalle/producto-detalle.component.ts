import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Product, ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './producto-detalle.component.html',
  styleUrls: ['./producto-detalle.component.css'],
})
export class ProductoDetalleComponent implements OnInit {
  producto?: Product;
  loading = false;
  error = '';

  tipo = 'PRODUCTO';
  descripcionLarga = '';
  caracteristicas: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cart: CartService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.error = 'Producto no válido.';
      return;
    }

    this.cargarProducto(id);
  }

  cargarProducto(id: number): void {
    this.loading = true;
    this.error = '';

    this.productService.getAll().subscribe({
      next: (productos) => {
        const encontrado = productos.find((p) => Number(p.id) === id);

        if (!encontrado) {
          this.error = 'Producto no encontrado.';
          return;
        }

        this.producto = encontrado;
        this.prepararDetalle(encontrado);
      },
      error: (e) => {
        console.error('Error cargando detalle:', e);
        this.error = 'No se pudo cargar el detalle del producto.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  prepararDetalle(producto: Product): void {
    const nombre = (producto.nombre || '').toLowerCase();

    if (nombre.includes('tinta')) {
      this.tipo = 'PRODUCTO';
      this.descripcionLarga =
        'Tintas para impresora orientadas al uso , educativo y personal. Son ideales para mantener una impresión continua, clara y adecuada para documentos, reportes, trabajos y materiales de oficina. Se recomienda consultar compatibilidad según el modelo de impresora.';

      this.caracteristicas = [
        'Uso recomendado: impresoras de inyección de tinta.',
        'Ideal para oficinas, negocios, instituciones y uso personal.',
        'Presentación práctica para reposición de tinta.',
        'Disponible para consultas según marca y modelo de impresora.',
      ];
      return;
    }

    if (nombre.includes('tonner') || nombre.includes('toner')) {
      this.tipo = 'PRODUCTO';
      this.descripcionLarga =
        'Tonners para impresoras láser, recomendados para oficinas, negocios y áreas administrativas que requieren impresiones constantes. Permiten obtener documentos nítidos y son una opción adecuada para trabajos de alto volumen.';

      this.caracteristicas = [
        'Uso recomendado: impresoras láser y fotocopiadoras.',
        'Adecuado para impresión de documentos empresariales.',
        'Consulta disponible según modelo de impresora.',
        'Producto orientado a oficinas, negocios e instituciones.',
      ];
      return;
    }

    if (nombre.includes('mantenimiento')) {
      this.tipo = 'SERVICIO';
      this.descripcionLarga =
        'Servicio de mantenimiento técnico para equipos informáticos, impresoras y máquinas. Está orientado a prevenir fallas, mejorar el rendimiento y brindar soporte a empresas, negocios o usuarios que necesitan atención técnica confiable.';

      this.caracteristicas = [
        'Revisión general del equipo.',
        'Limpieza y diagnóstico técnico.',
        'Soporte para impresoras, computadoras y equipos relacionados.',
        'Atención para empresas, negocios e instituciones.',
      ];
      return;
    }

    if (
      nombre.includes('software') ||
      nombre.includes('instalación') ||
      nombre.includes('instalacion')
    ) {
      this.tipo = 'SERVICIO';
      this.descripcionLarga =
        'Servicio de instalación y configuración de software para equipos de trabajo, computadoras personales o entornos empresariales. Incluye asistencia para dejar el sistema listo para su uso según la necesidad del cliente.';

      this.caracteristicas = [
        'Instalación y configuración de programas.',
        'Asistencia para equipos personales o empresariales.',
        'Configuración inicial según necesidad del cliente.',
        'Servicio recomendado para oficinas, estudiantes y negocios.',
      ];
      return;
    }

    this.tipo = producto.category || 'PRODUCTO';
    this.descripcionLarga =
      producto.descripcion ||
      'Producto o servicio tecnológico disponible en MULTISEGMA S.A.C.';

    this.caracteristicas = [
      'Atención personalizada.',
      'Disponible para cotización.',
      'Producto o servicio orientado a soluciones tecnológicas.',
    ];
  }

  agregar(producto: Product): void {
    this.cart.add(producto);
  }

  volver(): void {
    this.router.navigate(['/'], { fragment: 'productos' });
  }

  whatsappUrl(): string {
    const nombre = this.producto?.nombre || 'producto';
    return `https://wa.me/51998311743?text=Hola%20MULTISEGMA,%20quiero%20consultar%20por%20${encodeURIComponent(
      nombre
    )}.`;
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
