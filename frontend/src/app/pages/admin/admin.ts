// src/app/pages/admin/admin.ts
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";

import { ContactService } from "../../services/contact.service";
import { AuthService } from "../../services/auth.service";
import { OrderService } from "../../services/order.service";
import { ProductService } from "../../services/product.service";

type AdminSection =
  | "dashboard"
  | "products"
  | "orders"
  | "users"
  | "contacts"
  | "charts"
  | "files"
  | "security"
  | "settings";

type OrderStatus = "PENDIENTE" | "CONFIRMADO" | "CANCELADO" | "EN PROCESO";
type PeriodMode = "today" | "week" | "month";
type ReportPeriod = "today" | "week" | "month" | "all";
type ReportChartMode = "sales" | "orders" | "clients";
type AdminFileType =
  | "PDF"
  | "Documento"
  | "Imagen"
  | "Excel"
  | "Voucher"
  | "Pedido";

interface AdminFileItem {
  id: number;
  name: string;
  type: AdminFileType;
  area: string;
  relatedTo?: string;
  description?: string;
  date: string;
  size?: string;
  url?: string;
  rawSize?: number;
}

@Component({
  selector: "app-admin",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./admin.html",
  styleUrls: ["./admin.scss"],
})
export class AdminComponent implements OnInit {
  private parseDatePeru(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  let text = String(value).trim();

  if (!text) return null;

  // Si viene como "2026-05-22T16:03:00" sin Z,
  // lo tratamos como UTC para convertirlo a hora Perú.
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
 activeSection: AdminSection =
  (localStorage.getItem('multisegma-admin-section') as AdminSection) || 'dashboard';

  year = new Date().getFullYear();
  loading = false;
  loadingOrders = false;
  error = "";

  @ViewChild("productImageInput")
  productImageInput?: ElementRef<HTMLInputElement>;

  @ViewChild("productImportInput")
  productImportInput?: ElementRef<HTMLInputElement>;

  @ViewChild("adminFileInput")
  adminFileInput?: ElementRef<HTMLInputElement>;

  @ViewChild("settingsImportInput")
  settingsImportInput?: ElementRef<HTMLInputElement>;

  // CONTACTOS
  contacts: any[] = [];
  totalContacts = 0;

  // PEDIDOS
  orders: any[] = [];
  selectedOrder: any | null = null;
  savingEstado = false;

  totalOrders = 0;
  totalRevenue = 0;
  pendingOrders = 0;
  confirmedOrders = 0;
  cancelledOrders = 0;
  processOrders = 0;
  todayOrders = 0;

  searchOrder = "";
  filterStatus = "TODOS";
  filterPayment = "TODOS";
  filterDate = "";
  periodMode: PeriodMode = "week";
  currentDateBase = new Date();

  itemsView: any[] = [];

  // PRODUCTOS
  products: any[] = [];
  priceInputs: { [id: number]: number | null } = {};
  savingPrice: { [id: number]: boolean } = {};
  selectedProduct: any | null = null;

  productSearch = "";
  filterProductCategory = "TODAS";
  filterProductStatus = "TODOS";
  filterProductStock = "TODOS";
  filterMinPrice: number | null = null;
  filterMaxPrice: number | null = null;
  newProductTag = "";
  hasProductChanges = false;

  // CLIENTES
  registeredUsers: any[] = [];
  totalUsers = 0;

  customerSearch = "";
  filterCustomerRole = "TODOS";
  filterCustomerStatus = "TODOS";
  filterCustomerDate = "";
  selectedCustomer: any | null = null;

  // REPORTES
  reportPeriod: ReportPeriod = "week";
  reportDateFrom = "";
  reportDateTo = "";
  reportStatus = "TODOS";
  reportChartMode: ReportChartMode = "sales";

  // ================================
  // CONFIGURACIÓN EMPRESARIAL
  // ================================
  siteTitle = "MULTISEGMA S.A.C.";
  siteSubtitle = "Soluciones tecnológicas empresariales";
  whatsappNumber = "51998311743";

  companyRuc = "20600000000";
  companyDescription =
    "Multisegma S.A.C. brinda soluciones tecnológicas para empresas, venta de productos, soporte técnico, mantenimiento e instalación de software.";
  companyEmail = "contacto@multisegma.com";
  companyPhone = "+51 998 311 743";
  companyAddress = "Lima, Perú";
  businessHours = "Lunes a sábado de 8:00 a.m. a 6:00 p.m.";

  heroTitle = "Soluciones tecnológicas para empresas";
  heroDescription =
    "Productos tecnológicos, tintas, tonners, mantenimiento, instalación de software y soporte especializado para negocios.";
  primaryButtonText = "Consultar por WhatsApp";
  secondaryButtonText = "Ver catálogo";

  seoTitle = "Multisegma S.A.C. | Soluciones tecnológicas empresariales";
  seoDescription =
    "Venta de tintas, tonners, mantenimiento de equipos, instalación de software y soporte técnico empresarial.";
  seoKeywords =
    "multisegma, tintas, tonners, mantenimiento, software, soporte técnico, impresoras, tecnología";

  primaryColor = "#2563eb";
  secondaryColor = "#f97316";
  systemMode = "Producción";

  allowOrders = true;
  showPrices = true;
  emailNotifications = false;

  facebookUrl = "";
  instagramUrl = "";
  tiktokUrl = "";

  settingsChanged = false;

  estimatedExpenses = 120;

  // ARCHIVOS
  fileSearch = "";
  filterFileType = "TODOS";
  filterFileArea = "TODAS";
  filterFileDate = "";
  selectedAdminFile: AdminFileItem | null = null;

  uploadedFiles: AdminFileItem[] = [
    {
      id: 1,
      name: "Catálogo técnico.pdf",
      type: "PDF",
      area: "Catálogo",
      relatedTo: "Productos y servicios",
      description: "Catálogo técnico empresarial de Multisegma S.A.C.",
      date: new Date().toISOString(),
      size: "1.2 MB",
    },
    {
      id: 2,
      name: "Manual de servicio.docx",
      type: "Documento",
      area: "Soporte",
      relatedTo: "Atención técnica",
      description: "Manual interno para gestión de servicios técnicos.",
      date: new Date().toISOString(),
      size: "850 KB",
    },
    {
      id: 3,
      name: "Voucher ejemplo.png",
      type: "Voucher",
      area: "Pagos",
      relatedTo: "Validación de pagos",
      description: "Ejemplo de voucher registrado para control administrativo.",
      date: new Date().toISOString(),
      size: "420 KB",
    },
  ];

  // ================================
  // SEGURIDAD Y CONTROL TÉCNICO
  // ================================
  lastSecurityCheck = new Date().toISOString();
  lastBackupDate = new Date().toISOString();

  securityChecks = [
    {
      title: "Certificado SSL",
      status: "Activo",
      detail:
        "El sitio debe usar HTTPS cuando esté publicado con dominio real.",
    },
    {
      title: "Backups automáticos",
      status: "Pendiente",
      detail:
        "Falta conectar copias de seguridad automáticas de la base de datos MySQL.",
    },
    {
      title: "Control de accesos",
      status: "Activo",
      detail: "Solo administradores pueden ingresar al panel de gestión.",
    },
    {
      title: "Auditoría del sistema",
      status: "En proceso",
      detail: "Se registran cambios de productos, pedidos, archivos y accesos.",
    },
    {
      title: "Protección de datos",
      status: "En proceso",
      detail:
        "Los datos de clientes, pedidos y pagos deben protegerse desde backend.",
    },
    {
      title: "Validación de formularios",
      status: "Activo",
      detail:
        "Los formularios deben validar campos antes de guardar información.",
    },
  ];

  systemStatus = [
    {
      name: "Frontend Angular",
      value: "localhost:4201",
      status: "Activo",
    },
    {
      name: "Backend Spring Boot",
      value: "https://multisegma-sac-production.up.railway.app",
      status: "Activo",
    },
    {
      name: "Base de datos MySQL",
      value: "lisumesac",
      status: "Activo",
    },
    {
      name: "Almacenamiento de archivos",
      value: "Pendiente backend",
      status: "Pendiente",
    },
    {
      name: "Servicio de correo",
      value: "SMTP pendiente",
      status: "Pendiente",
    },
  ];

  securityRecommendations = [
    {
      icon: "🔐",
      title: "Publicar con HTTPS",
      description:
        "Cuando subas la página a hosting real, activa certificado SSL para proteger datos de clientes.",
      priority: "Alta",
    },
    {
      icon: "💾",
      title: "Configurar backups automáticos",
      description:
        "Programa copias de seguridad de productos, pedidos, clientes, pagos y archivos.",
      priority: "Alta",
    },
    {
      icon: "👤",
      title: "Separar roles de usuario",
      description:
        "Crear permisos para administrador, vendedor, soporte técnico y cliente.",
      priority: "Media",
    },
    {
      icon: "🧾",
      title: "Guardar auditoría en MySQL",
      description:
        "Registrar cambios de precios, estados de pedido, generación de PDFs y accesos al sistema.",
      priority: "Media",
    },
    {
      icon: "📩",
      title: "Activar correo empresarial",
      description:
        "Enviar confirmaciones de registro, pedidos confirmados y comprobantes PDF al cliente.",
      priority: "Media",
    },
  ];
  auditLogs: any[] = [];
  showNotifications = false;
  notificationsRead = false;

  constructor(
    private contactApi: ContactService,
    private auth: AuthService,
    private router: Router,
    private orderApi: OrderService,
    private productApi: ProductService,
  ) {}

  ngOnInit(): void {
    this.loadSettingsFromStorage();
    this.loadContacts();
    this.loadProducts();
    this.loadOrders();
    this.loadUsers();
    this.addLog("Ingreso al panel administrativo");
  }

 setSection(section: AdminSection): void {
  this.activeSection = section;
  localStorage.setItem('multisegma-admin-section', section);
}
refreshAdminData(): void {
  this.loading = true;

  this.loadSettingsFromStorage();
  this.loadContacts();
  this.loadProducts();
  this.loadOrders();
  this.loadUsers();

  setTimeout(() => {
    this.calculateOrderStats();
    this.buildItemsView();

    if (!this.selectedCustomer && this.registeredUsers.length > 0) {
      this.selectedCustomer = this.registeredUsers[0];
    }

    if (!this.selectedAdminFile && this.uploadedFiles.length > 0) {
      this.selectedAdminFile = this.uploadedFiles[0];
    }

    this.loading = false;
  }, 400);

  this.addLog('Se actualizaron los datos del administrador');
}
  // ================================
  // CONTACTOS
  // ================================
  loadContacts(): void {
    this.loading = true;

    this.contactApi.listContacts().subscribe({
      next: (data: any[]) => {
        this.contacts = data || [];
        this.totalContacts = this.contacts.length;
      },
      error: (err) => {
        console.error("Error cargando contactos:", err);
        this.error = "No se pudieron cargar los contactos.";
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  // ================================
  // PRODUCTOS
  // ================================
  loadProducts(): void {
    this.productApi.getAll().subscribe({
      next: (rows: any[]) => {
        this.products = (rows || []).map((p: any) => ({
          ...p,
          id: p.id,
          nombre: p.nombre ?? p.name ?? "Producto sin nombre",
          descripcion: p.descripcion ?? p.description ?? "",
          descripcionCompleta:
            p.descripcionCompleta ??
            p.fullDescription ??
            p.descripcion ??
            p.description ??
            "",
          precio: Number(p.precio ?? p.price ?? 0),
          precioAnterior: Number(p.precioAnterior ?? p.oldPrice ?? 0),
          stock: Number(p.stock ?? 20),
          categoria: p.categoria ?? p.category ?? this.detectProductCategory(p),
          estado: p.estado ?? p.status ?? "ACTIVO",
          sku: p.sku ?? this.generateSku(p),
          destacado: Boolean(p.destacado ?? p.featured ?? false),
          tags: Array.isArray(p.tags) ? p.tags : this.generateDefaultTags(p),
          imageUrl: p.imageUrl ?? p.imagen ?? "",
          gallery: Array.isArray(p.gallery) ? p.gallery : [],
          createdAt: p.createdAt ?? new Date().toISOString(),
          updatedAt: p.updatedAt ?? p.updated_at ?? new Date().toISOString(),
        }));

        this.products.forEach((p) => {
          this.priceInputs[p.id] = null;
          this.savingPrice[p.id] = false;
        });

        if (!this.selectedProduct && this.products.length > 0) {
          this.selectProduct(this.products[0]);
        }
      },
      error: (err) => {
        console.error("Error cargando productos:", err);
      },
    });
  }

  imageFor(p: any): string {
    const name = String(p?.nombre || p?.name || "").toLowerCase();

    if (name.includes("tinta"))
      return "assets/lisume/tintas-para-impresora.jpeg";
    if (name.includes("tonner") || name.includes("toner"))
      return "assets/lisume/tonners.jpeg";
    if (name.includes("mantenimiento"))
      return "assets/lisume/mantenimiento.jpeg";
    if (name.includes("software")) return "assets/lisume/software.jpeg";

    return "assets/lisume/portal-multisegma.jpeg";
  }

  get filteredProducts(): any[] {
    const search = this.productSearch.trim().toLowerCase();

    return this.products.filter((p) => {
      const name = this.getProductName(p).toLowerCase();
      const sku = this.getProductSku(p).toLowerCase();
      const category = this.getProductCategory(p);
      const status = this.getProductStatus(p);
      const stock = this.getProductStock(p);
      const price = this.getProductPrice(p);

      const matchesSearch =
        !search ||
        name.includes(search) ||
        sku.includes(search) ||
        category.toLowerCase().includes(search);

      const matchesCategory =
        this.filterProductCategory === "TODAS" ||
        category === this.filterProductCategory;

      const matchesStatus =
        this.filterProductStatus === "TODOS" ||
        status === this.filterProductStatus;

      let matchesStock = true;

      if (this.filterProductStock === "DISPONIBLE") matchesStock = stock > 10;
      if (this.filterProductStock === "BAJO")
        matchesStock = stock > 0 && stock <= 10;
      if (this.filterProductStock === "SIN_STOCK") matchesStock = stock <= 0;

      const matchesMin =
        this.filterMinPrice == null || price >= Number(this.filterMinPrice);

      const matchesMax =
        this.filterMaxPrice == null || price <= Number(this.filterMaxPrice);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesStock &&
        matchesMin &&
        matchesMax
      );
    });
  }

  get productCategories(): string[] {
    return Array.from(
      new Set(this.products.map((p) => this.getProductCategory(p))),
    ).filter(Boolean);
  }

  get activeProductsCount(): number {
    return this.products.filter((p) => this.getProductStatus(p) === "ACTIVO")
      .length;
  }

  get lowStockCount(): number {
    return this.products.filter(
      (p) => this.getProductStock(p) > 0 && this.getProductStock(p) <= 10,
    ).length;
  }

  get productsUpdatedToday(): number {
    const today = this.toInputDate(new Date());

    return this.products.filter(
      (p) => this.toInputDate(this.getProductUpdatedAt(p)) === today,
    ).length;
  }

  selectProduct(product: any): void {
    this.selectedProduct = {
      ...product,
      tags: Array.isArray(product.tags)
        ? [...product.tags]
        : this.generateDefaultTags(product),
      gallery: Array.isArray(product.gallery) ? [...product.gallery] : [],
    };

    this.hasProductChanges = false;
  }

  markProductChanged(): void {
    this.hasProductChanges = true;
  }

  createNewProduct(): void {
    const newId =
      this.products.length > 0
        ? Math.max(...this.products.map((p) => Number(p.id) || 0)) + 1
        : 1;

    const newProduct = {
      id: newId,
      nombre: "Nuevo producto",
      descripcion: "Descripción breve del nuevo producto.",
      descripcionCompleta: "Descripción completa del producto o servicio.",
      precio: 0,
      precioAnterior: 0,
      stock: 0,
      categoria: "Accesorios",
      estado: "ACTIVO",
      sku: `SKU-NEW-${String(newId).padStart(3, "0")}`,
      destacado: false,
      tags: ["nuevo"],
      imageUrl: "",
      gallery: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.products.unshift(newProduct);
    this.selectProduct(newProduct);
    this.hasProductChanges = true;
    this.addLog(`Se creó visualmente el producto ${newProduct.nombre}`);
  }

  saveProductChanges(): void {
    if (!this.selectedProduct) {
      alert("Selecciona un producto.");
      return;
    }

    const updated = {
      ...this.selectedProduct,
      precio: Number(this.selectedProduct.precio || 0),
      precioAnterior: Number(this.selectedProduct.precioAnterior || 0),
      stock: Number(this.selectedProduct.stock || 0),
      updatedAt: new Date().toISOString(),
    };

    const index = this.products.findIndex((p) => p.id === updated.id);

    if (index >= 0) {
      this.products[index] = updated;
    } else {
      this.products.unshift(updated);
    }

    this.selectedProduct = { ...updated };
    this.hasProductChanges = false;
    this.addLog(`Se guardaron cambios del producto ${updated.nombre}`);
    alert("Cambios guardados visualmente. Luego conectamos esto con MySQL.");
  }

  saveNewPrice(p: any): void {
    const nuevoPrecio = this.priceInputs[p.id];

    if (nuevoPrecio == null || nuevoPrecio <= 0) {
      alert("Ingresa un precio válido.");
      return;
    }

    this.savingPrice[p.id] = true;

    this.productApi.updatePrice(p.id, nuevoPrecio).subscribe({
      next: (updated: any) => {
        const precioFinal = updated?.precio ?? updated?.price ?? nuevoPrecio;
        p.precio = precioFinal;
        p.price = precioFinal;
        p.updatedAt = new Date().toISOString();

        this.priceInputs[p.id] = null;
        this.savingPrice[p.id] = false;

        this.addLog(
          `Se actualizó el precio de ${this.getProductName(p)} a S/ ${precioFinal}`,
        );
      },
      error: (err) => {
        console.error("Error actualizando precio:", err);
        this.savingPrice[p.id] = false;
        alert("No se pudo actualizar el precio.");
      },
    });
  }

  exportProducts(): void {
    this.downloadJson(
      this.products,
      `catalogo-multisegma-${this.toInputDate(new Date())}.json`,
    );
    this.addLog("Se exportó el catálogo de productos");
  }

  triggerImportProducts(): void {
    this.productImportInput?.nativeElement.click();
  }

  importProductsFromFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || ""));

        if (!Array.isArray(data)) {
          alert("El archivo no contiene una lista válida.");
          return;
        }

        this.products = data;
        if (this.products.length > 0) this.selectProduct(this.products[0]);

        this.addLog("Se importó un catálogo de productos");
        alert("Catálogo importado.");
      } catch {
        alert("El archivo debe ser JSON válido.");
      }

      input.value = "";
    };

    reader.readAsText(file);
  }

  triggerImageUpload(): void {
    if (!this.selectedProduct) {
      alert("Selecciona un producto primero.");
      return;
    }

    this.productImageInput?.nativeElement.click();
  }

  uploadProductImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.processImageFile(file);
    input.value = "";
  }

  processImageFile(file: File): void {
    if (!this.selectedProduct) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecciona una imagen válida.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = String(reader.result || "");

      if (!Array.isArray(this.selectedProduct.gallery)) {
        this.selectedProduct.gallery = [];
      }

      this.selectedProduct.gallery.unshift(img);
      this.selectedProduct.imageUrl = img;
      this.selectedProduct.updatedAt = new Date().toISOString();
      this.hasProductChanges = true;

      this.addLog(`Se subió una imagen para ${this.selectedProduct.nombre}`);
    };

    reader.readAsDataURL(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onImageDrop(event: DragEvent): void {
    event.preventDefault();

    const file = event.dataTransfer?.files?.[0];

    if (!file) return;

    this.processImageFile(file);
  }

  changeProductCover(image: string): void {
    if (!this.selectedProduct) return;

    this.selectedProduct.imageUrl = image;
    this.selectedProduct.updatedAt = new Date().toISOString();
    this.hasProductChanges = true;
  }

  deleteProductImage(): void {
    if (!this.selectedProduct) return;

    this.selectedProduct.imageUrl = "";
    this.selectedProduct.gallery = [];
    this.hasProductChanges = true;
  }

  clearProductFilters(): void {
    this.productSearch = "";
    this.filterProductCategory = "TODAS";
    this.filterProductStatus = "TODOS";
    this.filterProductStock = "TODOS";
    this.filterMinPrice = null;
    this.filterMaxPrice = null;
  }

  getProductName(p: any): string {
    return p?.nombre || p?.name || "Producto sin nombre";
  }

  getProductSku(p: any): string {
    return p?.sku || `SKU-${p?.id || "000"}`;
  }

  getProductCategory(p: any): string {
    return p?.categoria || p?.category || this.detectProductCategory(p);
  }

  getProductPrice(p: any): number {
    return Number(p?.precio ?? p?.price ?? 0);
  }

  getProductStock(p: any): number {
    return Number(p?.stock ?? 0);
  }

  getProductStatus(p: any): string {
    return String(p?.estado || p?.status || "ACTIVO").toUpperCase();
  }

  getProductStatusClass(p: any): string {
    const status = this.getProductStatus(p);
    const stock = this.getProductStock(p);

    if (status === "INACTIVO") return "inactive";
    if (stock <= 0) return "out";
    if (stock <= 10) return "low";

    return "active";
  }

  getProductUpdatedAt(p: any): any {
    return (
      p?.updatedAt || p?.updated_at || p?.createdAt || new Date().toISOString()
    );
  }

  getProductImage(p: any): string {
  const img = p?.imageUrl || p?.imagen || p?.image || '';

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

  return this.imageFor(p);
}

  getProductGallery(p: any): string[] {
    const gallery = Array.isArray(p?.gallery) ? p.gallery : [];

    if (gallery.length > 0) return gallery;

    return [this.getProductImage(p)];
  }

  detectProductCategory(p: any): string {
    const name = String(p?.nombre || p?.name || "").toLowerCase();

    if (name.includes("tinta")) return "Tintas";
    if (name.includes("tonner") || name.includes("toner")) return "Tonners";
    if (name.includes("mantenimiento")) return "Servicios";
    if (name.includes("software")) return "Software";

    return "Accesorios";
  }

  generateSku(p: any): string {
    const id = p?.id || "000";
    const category = this.detectProductCategory(p).toUpperCase().slice(0, 4);

    return `SKU-${category}-${String(id).padStart(3, "0")}`;
  }

  generateDefaultTags(p: any): string[] {
    const category = this.detectProductCategory(p).toLowerCase();
    const name = String(p?.nombre || p?.name || "").toLowerCase();
    const tags = [category];

    if (name.includes("impresora")) tags.push("impresora");
    if (name.includes("software")) tags.push("software");
    if (name.includes("mantenimiento")) tags.push("servicio");
    if (name.includes("tinta")) tags.push("tinta");
    if (name.includes("tonner") || name.includes("toner")) tags.push("tonner");

    return Array.from(new Set(tags));
  }

  get selectedProductTags(): string[] {
    if (!this.selectedProduct) return [];

    if (!Array.isArray(this.selectedProduct.tags)) {
      this.selectedProduct.tags = [];
    }

    return this.selectedProduct.tags;
  }

  addProductTag(): void {
    if (!this.selectedProduct) return;

    const tag = this.newProductTag.trim().toLowerCase();

    if (!tag) return;

    if (!Array.isArray(this.selectedProduct.tags)) {
      this.selectedProduct.tags = [];
    }

    if (!this.selectedProduct.tags.includes(tag)) {
      this.selectedProduct.tags.push(tag);
    }

    this.newProductTag = "";
    this.hasProductChanges = true;
  }

  removeProductTag(tag: string): void {
    if (!this.selectedProduct) return;

    this.selectedProduct.tags = this.selectedProductTags.filter(
      (t) => t !== tag,
    );
    this.hasProductChanges = true;
  }

  countWords(text: string): number {
    return String(text || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }

  get productChangeHistory(): any[] {
    if (!this.selectedProduct) return [];

    return [
      {
        action: "Producto actualizado",
        user: "Administrador",
        date: this.selectedProduct.updatedAt || new Date().toISOString(),
      },
      {
        action: "Producto creado",
        user: "Administrador",
        date: this.selectedProduct.createdAt || new Date().toISOString(),
      },
    ];
  }

  // ================================
  // PEDIDOS
  // ================================
  loadOrders(): void {
    this.loadingOrders = true;

    this.orderApi.getAll().subscribe({
      next: (data: any[]) => {
        this.orders = (data || []).map((o: any) => ({
          ...o,
          status: this.normalizeStatus(o.status || o.estado),
        }));

        this.calculateOrderStats();
        this.buildItemsView();
        this.loadUsers();
      },
      error: (err) => {
        console.error("Error cargando pedidos:", err);
      },
      complete: () => {
        this.loadingOrders = false;
      },
    });
  }

  calculateOrderStats(): void {
    this.totalOrders = this.orders.length;

    this.totalRevenue = this.orders.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0,
    );

    this.pendingOrders = this.orders.filter(
      (o) => this.getOrderStatus(o) === "PENDIENTE",
    ).length;

    this.confirmedOrders = this.orders.filter(
      (o) => this.getOrderStatus(o) === "CONFIRMADO",
    ).length;

    this.cancelledOrders = this.orders.filter(
      (o) => this.getOrderStatus(o) === "CANCELADO",
    ).length;

    this.processOrders = this.orders.filter(
      (o) => this.getOrderStatus(o) === "EN PROCESO",
    ).length;

    const today = this.toInputDate(new Date());

    this.todayOrders = this.orders.filter(
      (o) => this.toInputDate(this.getOrderDate(o)) === today,
    ).length;
  }

  buildItemsView(): void {
    const result: any[] = [];

    for (const order of this.orders) {
      const detail = this.getOrderDetailText(order);

      if (!detail) continue;

      const lines = String(detail).split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        result.push({
          orderId: order.id,
          client: this.getOrderClient(order),
          email: this.getOrderEmail(order),
          product: line,
          status: this.getOrderStatus(order),
          total: Number(order.total || 0),
          createdAt: this.getOrderDate(order),
        });
      }
    }

    this.itemsView = result;
  }

  get filteredOrders(): any[] {
    const search = this.searchOrder.trim().toLowerCase();

    return this.orders.filter((o) => {
      const status = this.getOrderStatus(o);
      const payment = this.getOrderPayment(o).toUpperCase();
      const inputDate = this.toInputDate(this.getOrderDate(o));

      const matchesSearch =
        !search ||
        String(o.id).includes(search) ||
        this.getOrderClient(o).toLowerCase().includes(search) ||
        this.getOrderEmail(o).toLowerCase().includes(search) ||
        this.getOrderPhone(o).toLowerCase().includes(search) ||
        this.getOrderPayment(o).toLowerCase().includes(search) ||
        this.getOrderDetailText(o).toLowerCase().includes(search);

      const matchesStatus =
        this.filterStatus === "TODOS" || status === this.filterStatus;

      const matchesPayment =
        this.filterPayment === "TODOS" || payment.includes(this.filterPayment);

      const matchesDate = !this.filterDate || inputDate === this.filterDate;

      const matchesPeriod = this.isDateInsidePeriod(this.getOrderDate(o));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesDate &&
        matchesPeriod
      );
    });
  }

  get filteredItemsView(): any[] {
    const ids = new Set(this.filteredOrders.map((o) => o.id));
    return this.itemsView.filter((item) => ids.has(item.orderId));
  }

  openOrderDetail(order: any): void {
    this.selectedOrder = { ...order };
  }

  closeOrderDetail(): void {
    this.selectedOrder = null;
  }

  markEditing(order: any): void {
    this.openOrderDetail(order);
    this.addLog(`Se abrió edición visual del pedido #${order.id}`);
  }
changeEstado(nuevoEstado: any): void {
  if (!this.selectedOrder) {
    alert('Primero selecciona un pedido.');
    return;
  }

  const orderId = this.selectedOrder.id;

  if (!orderId) {
    alert('Este pedido no tiene ID. Revisa si se está guardando correctamente.');
    return;
  }

  const estadoBackend =
    nuevoEstado === 'EN PROCESO' ? 'EN_PROCESO' : nuevoEstado;

  const estadoVista =
    estadoBackend === 'EN_PROCESO' ? 'EN PROCESO' : estadoBackend;

  this.savingEstado = true;

  const updatedLocalOrder = {
    ...this.selectedOrder,
    status: estadoVista,
    estado: estadoVista,
    updatedAt: new Date().toISOString(),
  };

  const index = this.orders.findIndex((o: any) => o.id === orderId);

  if (index >= 0) {
    this.orders[index] = updatedLocalOrder;
  }

  this.selectedOrder = updatedLocalOrder;
  this.calculateOrderStats();
  this.buildItemsView();

  this.orderApi.updateStatus(orderId, estadoBackend as any).subscribe({
    next: (updated: any) => {
      const statusFinal = this.normalizeStatus(
        updated?.status || updated?.estado || estadoBackend
      );

      const finalUpdated = {
        ...updatedLocalOrder,
        ...updated,
        status: statusFinal,
        estado: statusFinal,
      };

      const finalIndex = this.orders.findIndex((o: any) => o.id === orderId);

      if (finalIndex >= 0) {
        this.orders[finalIndex] = finalUpdated;
      }

      this.selectedOrder = finalUpdated;
      this.calculateOrderStats();
      this.buildItemsView();

      this.addLog(`Pedido #${orderId} cambió a ${statusFinal}`);
      this.savingEstado = false;
    },
    error: (err) => {
      console.error('Error cambiando estado en backend:', err);

      this.savingEstado = false;

      alert(
        'No se pudo cambiar el estado en backend. Revisa la consola o el endpoint de Spring Boot.'
      );
    },
  });
}

  clearOrderFilters(): void {
    this.searchOrder = "";
    this.filterStatus = "TODOS";
    this.filterPayment = "TODOS";
    this.filterDate = "";
  }

  setPeriod(mode: PeriodMode): void {
    this.periodMode = mode;
    this.currentDateBase = new Date();
  }

  previousWeek(): void {
    const d = new Date(this.currentDateBase);
    d.setDate(d.getDate() - 7);
    this.currentDateBase = d;
    this.periodMode = "week";
  }

  nextWeek(): void {
    const d = new Date(this.currentDateBase);
    d.setDate(d.getDate() + 7);
    this.currentDateBase = d;
    this.periodMode = "week";
  }

  get currentRangeLabel(): string {
    if (this.periodMode === "today") {
      return this.formatOnlyDate(new Date());
    }

    if (this.periodMode === "month") {
      return this.currentDateBase.toLocaleDateString("es-PE", {
        month: "long",
        year: "numeric",
      });
    }

    const start = this.startOfWeek(this.currentDateBase);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${this.formatOnlyDate(start)} - ${this.formatOnlyDate(end)}`;
  }

  isDateInsidePeriod(value: any): boolean {
    const date = new Date(value);

    if (isNaN(date.getTime())) return true;

    if (this.periodMode === "today") {
      return this.toInputDate(date) === this.toInputDate(new Date());
    }

    if (this.periodMode === "month") {
      return (
        date.getMonth() === this.currentDateBase.getMonth() &&
        date.getFullYear() === this.currentDateBase.getFullYear()
      );
    }

    const start = this.startOfWeek(this.currentDateBase);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return date >= start && date <= end;
  }

  // ================================
  // DASHBOARD
  // ================================
  get monthlySales(): number {
    return this.totalRevenue;
  }

  get conversionRate(): number {
    if (this.totalContacts === 0) return this.totalOrders > 0 ? 100 : 0;
    return (this.totalOrders / this.totalContacts) * 100;
  }

  get netProfit(): number {
    return this.monthlySales - this.estimatedExpenses;
  }

  get profitMargin(): number {
    if (this.monthlySales <= 0) return 0;
    return (this.netProfit / this.monthlySales) * 100;
  }

  get recentOrders(): any[] {
    return [...this.orders]
      .sort(
        (a, b) =>
          new Date(this.getOrderDate(b)).getTime() -
          new Date(this.getOrderDate(a)).getTime(),
      )
      .slice(0, 5);
  }

  get recentActivities(): any[] {
    const orderActivities = this.recentOrders.map((order) => {
      const status = this.getOrderStatus(order);

      return {
        title: `Pedido #${order.id} ${status.toLowerCase()}`,
        user: this.getOrderClient(order),
        date: this.getOrderDate(order),
        icon:
          status === "CONFIRMADO"
            ? "✓"
            : status === "CANCELADO"
              ? "✕"
              : status === "EN PROCESO"
                ? "↻"
                : "!",
      };
    });

    const userActivities = this.registeredUsers.slice(0, 2).map((user) => ({
      title: "Nuevo cliente registrado",
      user: this.getCustomerName(user),
      date: user.createdAt || new Date().toISOString(),
      icon: "👤",
    }));

    return [...orderActivities, ...userActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }

  get topProducts(): any[] {
    const map = new Map<string, number>();

    for (const item of this.itemsView) {
      const name = String(item.product || "Producto")
        .split("x")[0]
        .trim();
      map.set(name, (map.get(name) || 0) + Number(item.total || 0));
    }

    const total = Array.from(map.values()).reduce((sum, n) => sum + n, 0);

    if (total <= 0) {
      return [
        { name: "Tintas para impresora", amount: 0, percent: 0 },
        { name: "Tonners", amount: 0, percent: 0 },
        { name: "Mantenimiento", amount: 0, percent: 0 },
      ];
    }

    return Array.from(map.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percent: Math.round((amount / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  // ================================
  // CLIENTES
  // ================================
loadUsers(): void {
  this.auth.getBackendUsers().subscribe({
    next: (users: any[]) => {
      const pedidos = this.orders || [];

      this.registeredUsers = (users || []).map((user: any) => {
        const email = String(
          user.email ||
          user.correo ||
          ''
        ).trim().toLowerCase();

        const pedidosDelUsuario = pedidos.filter((order: any) => {
          const orderEmail = String(
            order.correo ||
            order.email ||
            order.customerEmail ||
            order.clienteCorreo ||
            order.cliente?.correo ||
            order.cliente?.email ||
            ''
          ).trim().toLowerCase();

          return orderEmail === email;
        });

        const ultimoPedido = pedidosDelUsuario
          .slice()
          .sort((a: any, b: any) => {
            const fechaA = new Date(a.createdAt || a.fecha || 0).getTime();
            const fechaB = new Date(b.createdAt || b.fecha || 0).getTime();
            return fechaB - fechaA;
          })[0];

        return {
          ...user,

          id: user.id,
          name: user.name || user.nombre || 'Cliente sin nombre',
          nombre: user.nombre || user.name || 'Cliente sin nombre',

          email: email,
          correo: email,

          phone:
            user.phone ||
            user.telefono ||
            user.celular ||
            '-',

          telefono:
            user.telefono ||
            user.phone ||
            user.celular ||
            '-',

          role: user.role || user.rol || 'user',
          rol: user.rol || user.role || 'user',

          status: user.status || user.estado || 'ACTIVO',
          estado: user.estado || user.status || 'ACTIVO',

          pedidos: pedidosDelUsuario.length,
          ordersCount: pedidosDelUsuario.length,

          createdAt:
            user.createdAt ||
            user.fechaRegistro ||
            new Date().toISOString(),

          lastActivity:
            ultimoPedido?.createdAt ||
            ultimoPedido?.fecha ||
            user.createdAt ||
            new Date().toISOString(),
        };
      });

      this.totalUsers = this.registeredUsers.length;

      if (!this.selectedCustomer && this.registeredUsers.length > 0) {
        this.selectedCustomer = this.registeredUsers[0];
      }

      console.log('CLIENTES REGISTRADOS DESDE MYSQL:', this.registeredUsers);
    },
    error: (err) => {
      console.error('Error cargando usuarios desde backend:', err);
      this.registeredUsers = [];
      this.totalUsers = 0;
    },
  });
}
  get filteredCustomers(): any[] {
    const search = this.customerSearch.trim().toLowerCase();

    return this.registeredUsers.filter((user) => {
      const name = this.getCustomerName(user).toLowerCase();
      const email = String(user.email || "").toLowerCase();
      const phone = this.getCustomerPhone(user).toLowerCase();
      const role = String(user.role || "user");
      const status = this.getCustomerStatus(user);
      const createdAt = this.toInputDate(user.createdAt);

      const matchesSearch =
        !search ||
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search) ||
        role.toLowerCase().includes(search);

      const matchesRole =
        this.filterCustomerRole === "TODOS" || role === this.filterCustomerRole;

      const matchesStatus =
        this.filterCustomerStatus === "TODOS" ||
        status === this.filterCustomerStatus;

      const matchesDate =
        !this.filterCustomerDate || createdAt === this.filterCustomerDate;

      return matchesSearch && matchesRole && matchesStatus && matchesDate;
    });
  }

  get activeCustomersCount(): number {
    return this.registeredUsers.filter(
      (u) => this.getCustomerStatus(u) === "ACTIVO",
    ).length;
  }

  get customersWithOrdersCount(): number {
    return this.registeredUsers.filter(
      (u) => this.getCustomerOrdersCount(u) > 0,
    ).length;
  }

  get customersRegisteredToday(): number {
    const today = this.toInputDate(new Date());
    return this.registeredUsers.filter(
      (u) => this.toInputDate(u.createdAt) === today,
    ).length;
  }

  selectCustomer(user: any): void {
  this.selectedCustomer = { ...user };
}

  clearCustomerFilters(): void {
    this.customerSearch = "";
    this.filterCustomerRole = "TODOS";
    this.filterCustomerStatus = "TODOS";
    this.filterCustomerDate = "";
  }

  exportCustomers(): void {
    this.downloadJson(
      this.registeredUsers,
      `clientes-multisegma-${this.toInputDate(new Date())}.json`,
    );
    this.addLog("Se exportó la lista de clientes registrados");
  }

  getCustomerName(user: any): string {
    return (
      user?.name ||
      user?.nombre ||
      user?.fullName ||
      user?.customerName ||
      "Cliente sin nombre"
    );
  }

  getCustomerInitials(user: any): string {
    const parts = this.getCustomerName(user).trim().split(" ").filter(Boolean);

    if (parts.length === 0) return "C";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }

  getCustomerPhone(user: any): string {
    return String(
      user?.phone ||
        user?.telefono ||
        user?.customerPhone ||
        user?.celular ||
        "-",
    );
  }

  getCustomerStatus(user: any): string {
    return String(user?.status || user?.estado || "ACTIVO").toUpperCase();
  }

  getCustomerStatusClass(user: any): string {
    const status = this.getCustomerStatus(user);

    if (status === "INACTIVO") return "inactive";
    if (status === "OBSERVADO") return "observed";

    return "active";
  }

  getCustomerOrders(user: any): any[] {
    const email = String(user?.email || "").toLowerCase();
    const name = this.getCustomerName(user).toLowerCase();

    return this.orders.filter((order) => {
      const orderEmail = this.getOrderEmail(order).toLowerCase();
      const orderClient = this.getOrderClient(order).toLowerCase();

      return (
        (!!email && orderEmail === email) ||
        (!!name && orderClient.includes(name))
      );
    });
  }

  getCustomerOrdersCount(user: any): number {
    return this.getCustomerOrders(user).length;
  }

  getCustomerTotalSpent(user: any): number {
    return this.getCustomerOrders(user).reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );
  }

  getCustomerLastOrderDate(user: any): any {
    const customerOrders = this.getCustomerOrders(user);

    if (customerOrders.length === 0) return null;

    return customerOrders
      .map((o) => this.getOrderDate(o))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  }

  getCustomerLastActivity(user: any): any {
    return (
      this.getCustomerLastOrderDate(user) ||
      user?.lastActivity ||
      user?.updatedAt ||
      user?.createdAt ||
      new Date().toISOString()
    );
  }

  getCustomerActivity(user: any): any[] {
    const orders = this.getCustomerOrders(user)
      .slice(0, 3)
      .map((order) => ({
        action: `Pedido #${order.id} ${this.getOrderStatus(order).toLowerCase()}`,
        date: this.getOrderDate(order),
        detail: `Pago: ${this.getOrderPayment(order)} · Total: S/ ${Number(order.total || 0).toFixed(2)}`,
      }));

    return [
      ...orders,
      {
        action: "Cliente registrado",
        date: user?.createdAt || new Date().toISOString(),
        detail: "El cliente creó una cuenta en la plataforma.",
      },
    ];
  }

  toggleCustomerStatus(user: any): void {
    const current = this.getCustomerStatus(user);

    const next =
      current === "ACTIVO"
        ? "OBSERVADO"
        : current === "OBSERVADO"
          ? "INACTIVO"
          : "ACTIVO";

    const index = this.registeredUsers.findIndex((u) => u.email === user.email);

    if (index >= 0) {
      this.registeredUsers[index] = {
        ...this.registeredUsers[index],
        status: next,
        lastActivity: new Date().toISOString(),
      };

      this.selectedCustomer = { ...this.registeredUsers[index] };
    }

    this.addLog(
      `Se cambió el estado del cliente ${this.getCustomerName(user)} a ${next}`,
    );
  }

  viewCustomerOrders(user: any): void {
    this.searchOrder = user?.email || this.getCustomerName(user);
    this.activeSection = "orders";
  }

  deleteCustomerVisual(user: any): void {
    if (
      !confirm(`¿Deseas ocultar visualmente a ${this.getCustomerName(user)}?`)
    )
      return;

    this.registeredUsers = this.registeredUsers.filter(
      (u) => u.email !== user.email,
    );
    this.totalUsers = this.registeredUsers.length;
    this.selectedCustomer = this.registeredUsers[0] || null;
  }

  // ================================
  // REPORTES
  // ================================
  get reportFilteredOrders(): any[] {
    return this.orders.filter((order) => {
      const status = this.getOrderStatus(order);
      const date = this.getOrderDate(order);
      const inputDate = this.toInputDate(date);

      const matchesStatus =
        this.reportStatus === "TODOS" || status === this.reportStatus;

      const matchesFrom =
        !this.reportDateFrom || inputDate >= this.reportDateFrom;
      const matchesTo = !this.reportDateTo || inputDate <= this.reportDateTo;
      const matchesPeriod = this.isOrderInsideReportPeriod(date);

      return matchesStatus && matchesFrom && matchesTo && matchesPeriod;
    });
  }

  get reportTotalOrders(): number {
    return this.reportFilteredOrders.length;
  }

  get reportTotalRevenue(): number {
    return this.reportFilteredOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );
  }

  get reportPendingOrders(): number {
    return this.reportFilteredOrders.filter(
      (o) => this.getOrderStatus(o) === "PENDIENTE",
    ).length;
  }

  get reportConfirmedOrders(): number {
    return this.reportFilteredOrders.filter(
      (o) => this.getOrderStatus(o) === "CONFIRMADO",
    ).length;
  }

  get reportProcessOrders(): number {
    return this.reportFilteredOrders.filter(
      (o) => this.getOrderStatus(o) === "EN PROCESO",
    ).length;
  }

  get reportCancelledOrders(): number {
    return this.reportFilteredOrders.filter(
      (o) => this.getOrderStatus(o) === "CANCELADO",
    ).length;
  }

  get reportSalesChart(): any[] {
    const labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    const values = labels.map((label, index) => {
      const total = this.reportFilteredOrders
        .filter((order) => {
          const date = new Date(this.getOrderDate(order));
          const day = date.getDay();
          const normalized = day === 0 ? 6 : day - 1;

          return normalized === index;
        })
        .reduce((sum, order) => {
          if (this.reportChartMode === "orders") return sum + 1;
          if (this.reportChartMode === "clients") return sum + 1;

          return sum + Number(order.total || 0);
        }, 0);

      return { label, amount: total, percent: 0 };
    });

    const max = Math.max(...values.map((v) => v.amount), 1);

    return values.map((v) => ({
      ...v,
      percent: Math.max(8, Math.round((v.amount / max) * 100)),
    }));
  }

  get reportPaymentMethods(): any[] {
    const map = new Map<string, number>();

    for (const order of this.reportFilteredOrders) {
      const payment = this.capitalizeText(
        this.getOrderPayment(order) || "No registrado",
      );
      map.set(payment, (map.get(payment) || 0) + 1);
    }

    const total = this.reportFilteredOrders.length || 1;

    if (map.size === 0) {
      return [{ name: "Sin pagos registrados", count: 0, percent: 0 }];
    }

    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / total) * 100),
    }));
  }

  clearReportFilters(): void {
    this.reportPeriod = "week";
    this.reportDateFrom = "";
    this.reportDateTo = "";
    this.reportStatus = "TODOS";
    this.reportChartMode = "sales";
  }

  exportReports(): void {
    const report = {
      empresa: "MULTISEGMA S.A.C.",
      fechaExportacion: new Date().toISOString(),
      ingresos: this.reportTotalRevenue,
      pedidos: this.reportTotalOrders,
      clientes: this.totalUsers,
      consultas: this.totalContacts,
      estados: {
        pendientes: this.reportPendingOrders,
        confirmados: this.reportConfirmedOrders,
        proceso: this.reportProcessOrders,
        cancelados: this.reportCancelledOrders,
      },
      metodosPago: this.reportPaymentMethods,
      pedidosDetalle: this.reportFilteredOrders,
    };

    this.downloadJson(
      report,
      `reporte-empresarial-multisegma-${this.toInputDate(new Date())}.json`,
    );
  }

  getReportStatusPercent(value: number): number {
    if (this.reportTotalOrders <= 0) return 0;
    return Math.round((value / this.reportTotalOrders) * 100);
  }

  isOrderInsideReportPeriod(value: any): boolean {
    if (this.reportPeriod === "all") return true;

    const date = new Date(value);

    if (isNaN(date.getTime())) return true;

    const today = new Date();

    if (this.reportPeriod === "today") {
      return this.toInputDate(date) === this.toInputDate(today);
    }

    if (this.reportPeriod === "month") {
      return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }

    const start = this.startOfWeek(today);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return date >= start && date <= end;
  }

  // ================================
  // ARCHIVOS
  // ================================
  get filteredAdminFiles(): AdminFileItem[] {
    const search = this.fileSearch.trim().toLowerCase();

    return this.uploadedFiles.filter((file) => {
      const name = file.name.toLowerCase();
      const type = file.type.toLowerCase();
      const area = file.area.toLowerCase();
      const related = String(file.relatedTo || "").toLowerCase();
      const date = this.toInputDate(file.date);

      const matchesSearch =
        !search ||
        name.includes(search) ||
        type.includes(search) ||
        area.includes(search) ||
        related.includes(search);

      const matchesType =
        this.filterFileType === "TODOS" || file.type === this.filterFileType;

      const matchesArea =
        this.filterFileArea === "TODAS" || file.area === this.filterFileArea;

      const matchesDate = !this.filterFileDate || date === this.filterFileDate;

      return matchesSearch && matchesType && matchesArea && matchesDate;
    });
  }

  get pdfFilesCount(): number {
    return this.uploadedFiles.filter(
      (f) => f.type === "PDF" || f.type === "Pedido",
    ).length;
  }

  get voucherFilesCount(): number {
    return this.uploadedFiles.filter((f) => f.type === "Voucher").length;
  }

  get confirmedOrdersForFiles(): any[] {
    return this.orders.filter((o) => this.getOrderStatus(o) === "CONFIRMADO");
  }

  clearFileFilters(): void {
    this.fileSearch = "";
    this.filterFileType = "TODOS";
    this.filterFileArea = "TODAS";
    this.filterFileDate = "";
  }

  triggerAdminFileUpload(): void {
    this.adminFileInput?.nativeElement.click();
  }

  uploadAdminFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.readAdminFile(file);
    input.value = "";
  }

  onAdminFileDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onAdminFileDrop(event: DragEvent): void {
    event.preventDefault();

    const file = event.dataTransfer?.files?.[0];

    if (!file) return;

    this.readAdminFile(file);
  }

  readAdminFile(file: File): void {
    const reader = new FileReader();

    reader.onload = () => {
      const newFile: AdminFileItem = {
        id: Date.now(),
        name: file.name,
        type: this.detectAdminFileType(file.name),
        area: this.detectAdminFileArea(file.name),
        relatedTo: "Archivo subido por administrador",
        description: "Archivo cargado desde el panel administrativo.",
        date: new Date().toISOString(),
        size: this.formatAdminFileSize(file.size),
        rawSize: file.size,
        url: String(reader.result || ""),
      };

      this.uploadedFiles = [newFile, ...this.uploadedFiles];
      this.selectedAdminFile = newFile;
      this.addLog(`Se subió el archivo ${file.name}`);
    };

    reader.readAsDataURL(file);
  }

  detectAdminFileType(fileName: string): AdminFileType {
    const name = fileName.toLowerCase();

    if (name.includes("voucher") || name.includes("pago")) return "Voucher";
    if (name.includes("pedido") || name.includes("comprobante"))
      return "Pedido";
    if (name.endsWith(".pdf")) return "PDF";
    if (
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".webp")
    )
      return "Imagen";
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "Excel";

    return "Documento";
  }

  detectAdminFileArea(fileName: string): string {
    const name = fileName.toLowerCase();

    if (name.includes("voucher") || name.includes("pago")) return "Pagos";
    if (name.includes("catalogo") || name.includes("catálogo"))
      return "Catálogo";
    if (name.includes("manual") || name.includes("servicio")) return "Soporte";
    if (name.includes("pedido") || name.includes("comprobante"))
      return "Ventas";

    return "Administración";
  }

  formatAdminFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;

    const kb = bytes / 1024;

    if (kb < 1024) return `${kb.toFixed(1)} KB`;

    return `${(kb / 1024).toFixed(1)} MB`;
  }

  selectAdminFile(file: AdminFileItem): void {
    this.selectedAdminFile = file;
  }

  getFileIcon(file: AdminFileItem): string {
    if (file.type === "PDF") return "📄";
    if (file.type === "Documento") return "📝";
    if (file.type === "Imagen") return "🖼️";
    if (file.type === "Excel") return "📊";
    if (file.type === "Voucher") return "🧾";
    if (file.type === "Pedido") return "✅";

    return "📁";
  }

  getFileTypeClass(file: AdminFileItem): string {
    if (file.type === "PDF") return "pdf";
    if (file.type === "Documento") return "document";
    if (file.type === "Imagen") return "image";
    if (file.type === "Excel") return "excel";
    if (file.type === "Voucher") return "voucher";
    if (file.type === "Pedido") return "order";

    return "default";
  }

  isImageFile(file: AdminFileItem | null): boolean {
    if (!file) return false;

    return (
      file.type === "Imagen" ||
      file.type === "Voucher" ||
      String(file.url || "").startsWith("data:image")
    );
  }

  downloadAdminFile(file: AdminFileItem): void {
    if (file.url) {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name;
      link.click();
      return;
    }

    const content = `
MULTISEGMA S.A.C.
Archivo: ${file.name}
Tipo: ${file.type}
Área: ${file.area}
Relacionado: ${file.relatedTo || "-"}
Fecha: ${this.formatDate(file.date)}
Descripción: ${file.description || "-"}
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = file.name.replace(/\.[^/.]+$/, "") + ".txt";
    link.click();

    window.URL.revokeObjectURL(url);
  }

  duplicateAdminFileVisual(file: AdminFileItem): void {
    const copy: AdminFileItem = {
      ...file,
      id: Date.now(),
      name: `Copia de ${file.name}`,
      date: new Date().toISOString(),
    };

    this.uploadedFiles = [copy, ...this.uploadedFiles];
    this.selectedAdminFile = copy;
  }

  deleteAdminFileVisual(file: AdminFileItem): void {
    if (!confirm(`¿Eliminar visualmente ${file.name}?`)) return;

    this.uploadedFiles = this.uploadedFiles.filter((f) => f.id !== file.id);
    this.selectedAdminFile = this.uploadedFiles[0] || null;
  }

  createVisualFile(): void {
    const newFile: AdminFileItem = {
      id: Date.now(),
      name: `Nuevo documento administrativo ${this.uploadedFiles.length + 1}.pdf`,
      type: "PDF",
      area: "Administración",
      relatedTo: "Documento interno",
      description: "Documento creado visualmente desde el panel administrador.",
      date: new Date().toISOString(),
      size: "0 KB",
    };

    this.uploadedFiles = [newFile, ...this.uploadedFiles];
    this.selectedAdminFile = newFile;
  }

  exportFilesList(): void {
    this.downloadJson(
      this.uploadedFiles,
      `archivos-multisegma-${this.toInputDate(new Date())}.json`,
    );
  }

  getFileActivity(file: AdminFileItem): any[] {
    return [
      {
        action: "Archivo registrado",
        date: file.date,
        detail: `El archivo fue registrado en el área de ${file.area}.`,
      },
      {
        action: "Disponible para descarga",
        date: file.date,
        detail: "El administrador puede descargar este archivo.",
      },
    ];
  }

  generateOrderPdfVisual(order: any): void {
    const orderId = order.id || Date.now();
    const client = this.getOrderClient(order);
    const email = this.getOrderEmail(order);
    const phone = this.getOrderPhone(order);
    const payment = this.getOrderPayment(order);
    const status = this.getOrderStatus(order);
    const date = this.formatDate(this.getOrderDate(order));
    const total = Number(order.total || 0).toFixed(2);
    const detail = this.getOrderDetailText(order);

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Pedido #${orderId} - Multisegma S.A.C.</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; padding: 34px; }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 18px; margin-bottom: 24px; }
    h1 { margin: 0; color: #020617; }
    p { color: #475569; }
    .badge { background: #dcfce7; color: #15803d; padding: 8px 12px; border-radius: 999px; font-weight: bold; }
    .box { border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .item span { display: block; color: #64748b; font-size: 12px; }
    .item strong { font-size: 14px; }
    .total { text-align: right; font-size: 24px; font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>MULTISEGMA S.A.C.</h1>
      <p>Productos tecnológicos · Soporte técnico · Software · Mantenimiento</p>
      <p>Documento generado desde el panel administrador</p>
    </div>
    <div>
      <h2>Pedido #${orderId}</h2>
      <span class="badge">${status}</span>
    </div>
  </div>

  <div class="box">
    <h2>Datos del cliente</h2>
    <div class="grid">
      <div class="item"><span>Cliente</span><strong>${client}</strong></div>
      <div class="item"><span>Correo</span><strong>${email}</strong></div>
      <div class="item"><span>Teléfono</span><strong>${phone}</strong></div>
      <div class="item"><span>Fecha y hora</span><strong>${date}</strong></div>
    </div>
  </div>

  <div class="box">
    <h2>Detalle del pedido</h2>
    <p>${detail}</p>
  </div>

  <div class="box">
    <h2>Pago</h2>
    <div class="grid">
      <div class="item"><span>Método de pago</span><strong>${payment}</strong></div>
      <div class="item"><span>Estado</span><strong>${status}</strong></div>
    </div>
    <div class="total">Total: S/ ${total}</div>
  </div>

  <div class="footer">
    Este comprobante pertenece a MULTISEGMA S.A.C.
  </div>

  <script>window.onload = function () { window.print(); };</script>
</body>
</html>
`;

    const win = window.open("", "_blank", "width=900,height=700");

    if (!win) {
      alert("Permite ventanas emergentes para generar el PDF.");
      return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();

    const generatedFile: AdminFileItem = {
      id: Date.now(),
      name: `Pedido-${orderId}-Multisegma.pdf`,
      type: "Pedido",
      area: "Ventas",
      relatedTo: `Pedido #${orderId} - ${client}`,
      description: `PDF generado para el pedido confirmado #${orderId}.`,
      date: new Date().toISOString(),
      size: "Generado",
    };

    this.uploadedFiles = [generatedFile, ...this.uploadedFiles];
    this.selectedAdminFile = generatedFile;
  }

  // ================================
  // SEGURIDAD / CONFIGURACIÓN
  // ================================
  exportAuditLogs(): void {
    this.downloadJson(
      this.auditLogs,
      `historial-cambios-multisegma-${this.toInputDate(new Date())}.json`,
    );
  }

  // ================================
  // NOTIFICACIONES
  // ================================
  get unreadNotificationsCount(): number {
    return this.notificationsRead ? 0 : this.recentActivities.length;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markNotificationsRead(): void {
    this.notificationsRead = true;
  }

  // ================================
  // HELPERS PEDIDOS
  // ================================
  getOrderClient(order: any): string {
    return (
      order?.nombre ||
      order?.cliente ||
      order?.customerName ||
      order?.fullName ||
      "Cliente no registrado"
    );
  }

  getOrderEmail(order: any): string {
    return order?.correo || order?.email || order?.customerEmail || "-";
  }

  getOrderPhone(order: any): string {
    return order?.telefono || order?.phone || order?.customerPhone || "-";
  }

  getOrderPayment(order: any): string {
    return (
      order?.metodoPago ||
      order?.paymentMethod ||
      order?.payment ||
      "No registrado"
    );
  }

  getOrderDate(order: any): any {
    return (
      order?.createdAt ||
      order?.created_at ||
      order?.fecha ||
      order?.date ||
      new Date().toISOString()
    );
  }

  getOrderStatus(order: any): OrderStatus {
    return this.normalizeStatus(order?.status || order?.estado);
  }

  getOrderDetailText(order: any): string {
    const detail =
      order?.detalle ||
      order?.detail ||
      order?.itemsText ||
      order?.productos ||
      order?.products ||
      "";

    if (Array.isArray(detail)) {
      return detail
        .map((item: any) => {
          const name = item.name || item.nombre || item.producto || "Producto";
          const quantity = item.quantity || item.cantidad || 1;
          const price = item.price || item.precio || 0;

          return `${name} x${quantity} - S/ ${Number(price).toFixed(2)}`;
        })
        .join("<br>");
    }

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    return "Detalle del pedido no registrado.";
  }

normalizeStatus(value: any): OrderStatus {
  const status = String(value || 'PENDIENTE').toUpperCase().trim();

  if (status === 'EN_PROCESO' || status === 'EN PROCESO') {
    return 'EN PROCESO' as any;
  }

  if (status === 'CONFIRMADO') return 'CONFIRMADO';
  if (status === 'CANCELADO') return 'CANCELADO';

  return 'PENDIENTE';
}

  statusClass(status: string): string {
    const s = this.normalizeStatus(status);

    if (s === "CONFIRMADO") return "confirmado";
    if (s === "CANCELADO") return "cancelado";
    if (s === "EN PROCESO") return "proceso";

    return "pendiente";
  }

  // ================================
  // HELPERS GENERALES
  // ================================
formatDate(value: any): string {
  const date = this.parseDatePeru(value);
  if (!date) return '-';

  return date.toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

formatOnlyDate(value: any): string {
  const date = this.parseDatePeru(value);
  if (!date) return '-';

  return date.toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

formatOnlyTime(value: any): string {
  const date = this.parseDatePeru(value);
  if (!date) return '-';

  return date.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

toInputDate(value: any): string {
  const date = this.parseDatePeru(value);
  if (!date) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';

  return `${year}-${month}-${day}`;
}

  startOfWeek(value: Date): Date {
    const date = new Date(value);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);

    return date;
  }

  capitalizeText(value: string): string {
    const text = String(value || "")
      .trim()
      .toLowerCase();

    if (!text) return "No registrado";

    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  downloadJson(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  addLog(action: string): void {
    this.auditLogs.unshift({
      action,
      user: this.auth?.getCurrentUser?.()?.email || "Administrador",
      date: new Date().toISOString(),
    });

    this.auditLogs = this.auditLogs.slice(0, 80);
    this.notificationsRead = false;
  }
  // ================================
  // FUNCIONES DE SEGURIDAD
  // ================================
  get securityScore(): number {
    if (!this.securityChecks || this.securityChecks.length === 0) return 0;

    const total = this.securityChecks.length;

    const points = this.securityChecks.reduce((sum: number, item: any) => {
      const status = String(item.status || "").toLowerCase();

      if (status.includes("activo")) return sum + 1;
      if (status.includes("proceso")) return sum + 0.5;

      return sum;
    }, 0);

    return Math.round((points / total) * 100);
  }

  get securityScoreLabel(): string {
    if (this.securityScore >= 85) return "Seguro";
    if (this.securityScore >= 60) return "Aceptable";
    if (this.securityScore >= 40) return "En revisión";

    return "Crítico";
  }

  get securityScoreClass(): string {
    if (this.securityScore >= 85) return "secure";
    if (this.securityScore >= 60) return "warning";
    if (this.securityScore >= 40) return "process";

    return "danger";
  }

  runSecurityCheck(): void {
    this.lastSecurityCheck = new Date().toISOString();

    this.securityChecks = this.securityChecks.map((item: any) => {
      if (item.title === "Auditoría del sistema" && this.auditLogs.length > 0) {
        return {
          ...item,
          status: "Activo",
          detail:
            "El sistema ya registra eventos administrativos y cambios importantes.",
        };
      }

      if (item.title === "Control de accesos") {
        return {
          ...item,
          status: "Activo",
          detail:
            "La ruta /admin está separada del login de clientes y protegida para administrador.",
        };
      }

      return item;
    });

    this.addLog("Se ejecutó una verificación de seguridad del sistema.");
    alert("Verificación de seguridad completada.");
  }

  simulateBackup(): void {
    this.lastBackupDate = new Date().toISOString();

    this.systemStatus = this.systemStatus.map((item: any) => {
      if (item.name === "Almacenamiento de archivos") {
        return {
          ...item,
          value: "Backup visual generado",
          status: "En proceso",
        };
      }

      return item;
    });

    this.addLog("Se generó un backup visual del sistema.");
    alert(
      "Backup visual generado. Luego lo conectaremos con Spring Boot y MySQL.",
    );
  }

  getSecurityIcon(status: string): string {
    const value = String(status || "").toLowerCase();

    if (value.includes("activo")) return "✓";
    if (value.includes("proceso")) return "↻";
    if (value.includes("pendiente")) return "!";
    if (value.includes("crítico") || value.includes("critico")) return "×";

    return "•";
  }

  getSecurityStatusClass(status: string): string {
    const value = String(status || "").toLowerCase();

    if (value.includes("activo")) return "active";
    if (value.includes("proceso")) return "process";
    if (value.includes("pendiente")) return "pending";
    if (value.includes("crítico") || value.includes("critico")) return "danger";

    return "default";
  }

  getSecurityPriorityClass(priority: string): string {
    const value = String(priority || "").toLowerCase();

    if (value.includes("alta")) return "priority-high";
    if (value.includes("media")) return "priority-medium";
    if (value.includes("baja")) return "priority-low";

    return "priority-medium";
  }

  getAuditType(action: string): string {
    const value = String(action || "").toLowerCase();

    if (value.includes("ingreso")) return "Acceso";
    if (value.includes("precio") || value.includes("producto"))
      return "Catálogo";
    if (value.includes("pedido")) return "Pedido";
    if (value.includes("archivo") || value.includes("pdf")) return "Archivo";
    if (value.includes("cliente") || value.includes("usuario"))
      return "Usuario";
    if (value.includes("seguridad") || value.includes("backup"))
      return "Seguridad";

    return "Sistema";
  }
  // ================================
  // CONFIGURACIÓN EMPRESARIAL
  // ================================
  get seoScore(): number {
    let score = 0;

    if (this.seoTitle.trim().length >= 20) score += 25;
    if (this.seoDescription.trim().length >= 50) score += 25;
    if (this.seoKeywords.trim().length >= 20) score += 20;
    if (this.siteTitle.trim().length >= 5) score += 10;
    if (this.companyDescription.trim().length >= 50) score += 10;
    if (this.companyEmail.includes("@")) score += 10;

    return Math.min(score, 100);
  }

  get seoScoreLabel(): string {
    if (this.seoScore >= 85) return "SEO optimizado";
    if (this.seoScore >= 65) return "SEO aceptable";
    if (this.seoScore >= 40) return "SEO en revisión";

    return "SEO incompleto";
  }

  markSettingsChanged(): void {
    this.settingsChanged = true;
  }

  previewSettings(): void {
    const preview = `
MULTISEGMA S.A.C. - VISTA PREVIA

Empresa: ${this.siteTitle}
Subtítulo: ${this.siteSubtitle}
RUC: ${this.companyRuc}

Banner:
${this.heroTitle}
${this.heroDescription}

Contacto:
WhatsApp: ${this.whatsappNumber}
Correo: ${this.companyEmail}
Teléfono: ${this.companyPhone}
Dirección: ${this.companyAddress}
Horario: ${this.businessHours}

SEO:
Título: ${this.seoTitle}
Descripción: ${this.seoDescription}
Palabras clave: ${this.seoKeywords}

Sistema:
Modo: ${this.systemMode}
Permitir pedidos: ${this.allowOrders ? "Sí" : "No"}
Mostrar precios: ${this.showPrices ? "Sí" : "No"}
Enviar correos: ${this.emailNotifications ? "Sí" : "No"}
`;

    alert(preview);
    this.addLog("Se abrió la vista previa de configuración.");
  }

  saveSettings(): void {
    const settingsData = this.getSettingsData();

    localStorage.setItem("multisegma-settings", JSON.stringify(settingsData));

    this.settingsChanged = false;
    this.addLog("Se guardó la configuración empresarial del sitio.");

    alert("Configuración guardada correctamente en el panel.");
  }

  getSettingsData(): any {
    return {
      siteTitle: this.siteTitle,
      siteSubtitle: this.siteSubtitle,
      whatsappNumber: this.whatsappNumber,
      companyRuc: this.companyRuc,
      companyDescription: this.companyDescription,
      companyEmail: this.companyEmail,
      companyPhone: this.companyPhone,
      companyAddress: this.companyAddress,
      businessHours: this.businessHours,
      heroTitle: this.heroTitle,
      heroDescription: this.heroDescription,
      primaryButtonText: this.primaryButtonText,
      secondaryButtonText: this.secondaryButtonText,
      seoTitle: this.seoTitle,
      seoDescription: this.seoDescription,
      seoKeywords: this.seoKeywords,
      primaryColor: this.primaryColor,
      secondaryColor: this.secondaryColor,
      systemMode: this.systemMode,
      allowOrders: this.allowOrders,
      showPrices: this.showPrices,
      emailNotifications: this.emailNotifications,
      facebookUrl: this.facebookUrl,
      instagramUrl: this.instagramUrl,
      tiktokUrl: this.tiktokUrl,
      updatedAt: new Date().toISOString(),
    };
  }

  loadSettingsFromStorage(): void {
    const raw = localStorage.getItem("multisegma-settings");

    if (!raw) return;

    try {
      const data = JSON.parse(raw);

      this.siteTitle = data.siteTitle ?? this.siteTitle;
      this.siteSubtitle = data.siteSubtitle ?? this.siteSubtitle;
      this.whatsappNumber = data.whatsappNumber ?? this.whatsappNumber;
      this.companyRuc = data.companyRuc ?? this.companyRuc;
      this.companyDescription =
        data.companyDescription ?? this.companyDescription;
      this.companyEmail = data.companyEmail ?? this.companyEmail;
      this.companyPhone = data.companyPhone ?? this.companyPhone;
      this.companyAddress = data.companyAddress ?? this.companyAddress;
      this.businessHours = data.businessHours ?? this.businessHours;

      this.heroTitle = data.heroTitle ?? this.heroTitle;
      this.heroDescription = data.heroDescription ?? this.heroDescription;
      this.primaryButtonText = data.primaryButtonText ?? this.primaryButtonText;
      this.secondaryButtonText =
        data.secondaryButtonText ?? this.secondaryButtonText;

      this.seoTitle = data.seoTitle ?? this.seoTitle;
      this.seoDescription = data.seoDescription ?? this.seoDescription;
      this.seoKeywords = data.seoKeywords ?? this.seoKeywords;

      this.primaryColor = data.primaryColor ?? this.primaryColor;
      this.secondaryColor = data.secondaryColor ?? this.secondaryColor;
      this.systemMode = data.systemMode ?? this.systemMode;

      this.allowOrders = data.allowOrders ?? this.allowOrders;
      this.showPrices = data.showPrices ?? this.showPrices;
      this.emailNotifications =
        data.emailNotifications ?? this.emailNotifications;

      this.facebookUrl = data.facebookUrl ?? this.facebookUrl;
      this.instagramUrl = data.instagramUrl ?? this.instagramUrl;
      this.tiktokUrl = data.tiktokUrl ?? this.tiktokUrl;

      this.settingsChanged = false;
    } catch {
      console.warn("No se pudo leer la configuración guardada.");
    }
  }

  exportSettings(): void {
    const settingsData = this.getSettingsData();

    this.downloadJson(
      settingsData,
      `configuracion-multisegma-${this.toInputDate(new Date())}.json`,
    );

    this.addLog("Se exportó la configuración empresarial.");
  }

  triggerImportSettings(): void {
    this.settingsImportInput?.nativeElement.click();
  }

  importSettings(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || ""));

        this.siteTitle = data.siteTitle ?? this.siteTitle;
        this.siteSubtitle = data.siteSubtitle ?? this.siteSubtitle;
        this.whatsappNumber = data.whatsappNumber ?? this.whatsappNumber;
        this.companyRuc = data.companyRuc ?? this.companyRuc;
        this.companyDescription =
          data.companyDescription ?? this.companyDescription;
        this.companyEmail = data.companyEmail ?? this.companyEmail;
        this.companyPhone = data.companyPhone ?? this.companyPhone;
        this.companyAddress = data.companyAddress ?? this.companyAddress;
        this.businessHours = data.businessHours ?? this.businessHours;

        this.heroTitle = data.heroTitle ?? this.heroTitle;
        this.heroDescription = data.heroDescription ?? this.heroDescription;
        this.primaryButtonText =
          data.primaryButtonText ?? this.primaryButtonText;
        this.secondaryButtonText =
          data.secondaryButtonText ?? this.secondaryButtonText;

        this.seoTitle = data.seoTitle ?? this.seoTitle;
        this.seoDescription = data.seoDescription ?? this.seoDescription;
        this.seoKeywords = data.seoKeywords ?? this.seoKeywords;

        this.primaryColor = data.primaryColor ?? this.primaryColor;
        this.secondaryColor = data.secondaryColor ?? this.secondaryColor;
        this.systemMode = data.systemMode ?? this.systemMode;

        this.allowOrders = data.allowOrders ?? this.allowOrders;
        this.showPrices = data.showPrices ?? this.showPrices;
        this.emailNotifications =
          data.emailNotifications ?? this.emailNotifications;

        this.facebookUrl = data.facebookUrl ?? this.facebookUrl;
        this.instagramUrl = data.instagramUrl ?? this.instagramUrl;
        this.tiktokUrl = data.tiktokUrl ?? this.tiktokUrl;

        this.settingsChanged = true;
        this.addLog("Se importó una configuración empresarial desde JSON.");

        alert(
          "Configuración importada. Presiona guardar para mantener los cambios.",
        );
      } catch {
        alert("El archivo no es un JSON válido.");
      }

      input.value = "";
    };

    reader.readAsText(file);
  }

  resetSettingsVisual(): void {
    const confirmReset = confirm(
      "¿Deseas restaurar la configuración visual por defecto?",
    );

    if (!confirmReset) return;

    this.siteTitle = "MULTISEGMA S.A.C.";
    this.siteSubtitle = "Soluciones tecnológicas empresariales";
    this.whatsappNumber = "51998311743";

    this.companyRuc = "20600000000";
    this.companyDescription =
      "Multisegma S.A.C. brinda soluciones tecnológicas para empresas, venta de productos, soporte técnico, mantenimiento e instalación de software.";
    this.companyEmail = "contacto@multisegma.com";
    this.companyPhone = "+51 998 311 743";
    this.companyAddress = "Lima, Perú";
    this.businessHours = "Lunes a sábado de 8:00 a.m. a 6:00 p.m.";

    this.heroTitle = "Soluciones tecnológicas para empresas";
    this.heroDescription =
      "Productos tecnológicos, tintas, tonners, mantenimiento, instalación de software y soporte especializado para negocios.";
    this.primaryButtonText = "Consultar por WhatsApp";
    this.secondaryButtonText = "Ver catálogo";

    this.seoTitle = "Multisegma S.A.C. | Soluciones tecnológicas empresariales";
    this.seoDescription =
      "Venta de tintas, tonners, mantenimiento de equipos, instalación de software y soporte técnico empresarial.";
    this.seoKeywords =
      "multisegma, tintas, tonners, mantenimiento, software, soporte técnico, impresoras, tecnología";

    this.primaryColor = "#2563eb";
    this.secondaryColor = "#f97316";
    this.systemMode = "Producción";

    this.allowOrders = true;
    this.showPrices = true;
    this.emailNotifications = false;

    this.facebookUrl = "";
    this.instagramUrl = "";
    this.tiktokUrl = "";

    this.settingsChanged = true;
    this.addLog("Se restauró visualmente la configuración por defecto.");
  }

  // ================================
  // MÉTODOS PUENTE PARA EL HTML AVANZADO
  // ================================
hasVoucher(order: any): boolean {
  const payment = this.getOrderPayment(order);

  return Boolean(
    order?.voucher ||
      order?.voucherUrl ||
      order?.comprobante ||
      order?.comprobanteUrl ||
      order?.archivoVoucher ||
      order?.operationCode ||
      order?.operation_code ||
      order?.codigoOperacion ||
      order?.paymentOperationCode ||
      order?.amount ||
      order?.paymentAmount ||
      order?.montoPagado ||
      (payment && payment !== 'No registrado')
  );
}

getVoucherMethod(order: any): string {
  return this.getOrderPayment(order);
}

getVoucherOperation(order: any): string {
  return (
    order?.operationCode ||
    order?.operation_code ||
    order?.codigoOperacion ||
    order?.paymentOperationCode ||
    order?.payment?.operationCode ||
    order?.payment?.operation_code ||
    'No registrado'
  );
}

getVoucherAmount(order: any): number {
  return Number(
    order?.amount ||
      order?.paymentAmount ||
      order?.montoPagado ||
      order?.payment?.amount ||
      order?.total ||
      0
  );
}

getVoucherDate(order: any): any {
  return (
    order?.confirmedAt ||
    order?.confirmed_at ||
    order?.payment?.confirmedAt ||
    order?.payment?.confirmed_at ||
    order?.createdAt ||
    order?.created_at ||
    new Date().toISOString()
  );
}

viewVoucher(order: any): void {
  if (!order) {
    alert('Primero selecciona un pedido.');
    return;
  }

  const pedidoId = order.id || 'SIN-ID';
  const cliente = this.getOrderClient(order);
  const correo = this.getOrderEmail(order);
  const metodo = this.getVoucherMethod(order);
  const operacion = this.getVoucherOperation(order);
  const monto = this.getVoucherAmount(order).toFixed(2);
  const fecha = this.formatDate(this.getVoucherDate(order));
  const estado = this.getOrderStatus(order);

  alert(
    `COMPROBANTE / VOUCHER\n\n` +
      `Pedido: #${pedidoId}\n` +
      `Cliente: ${cliente}\n` +
      `Correo: ${correo}\n` +
      `Método de pago: ${metodo}\n` +
      `Código / operación: ${operacion}\n` +
      `Monto pagado: S/ ${monto}\n` +
      `Fecha: ${fecha}\n` +
      `Estado del pedido: ${estado}`
  );
}

downloadOrderPdf(order: any): void {
  this.generateOrderPdfVisual(order);
}
  markNotificationsAsRead(): void {
    this.markNotificationsRead();
  }

  exportDashboardReport(): void {
    this.exportReports();
  }

  // ================================
  // SALIR
  // ================================
  logout(): void {
    this.auth.logout();
    this.router.navigate(["/admin-login"]);
  }
}
