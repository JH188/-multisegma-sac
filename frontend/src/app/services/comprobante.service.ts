import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Comprobante {
  id?: number;
  orderId: number;

  tipoComprobante: 'BOLETA' | 'FACTURA';
  serie: string;
  numero: number;
  numeroCompleto: string;

  empresaRuc?: string;
  empresaRazonSocial?: string;
  empresaDireccion?: string;

  clienteTipoDocumento?: string;
  clienteDocumento?: string;
  clienteNombre?: string;
  clienteDireccion?: string;
  clienteCorreo?: string;

  subtotal: number;
  igv: number;
  total: number;

  estado?: string;
  fechaEmision?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ComprobanteService {
  private apiUrl =
    'https://multisegma-sac-production.up.railway.app/api/comprobantes';

  constructor(private http: HttpClient) {}

  listar(): Observable<Comprobante[]> {
    return this.http.get<Comprobante[]>(this.apiUrl);
  }

  listarPorPedido(orderId: number): Observable<Comprobante[]> {
    return this.http.get<Comprobante[]>(`${this.apiUrl}/order/${orderId}`);
  }

  crear(comprobante: Comprobante): Observable<Comprobante> {
    return this.http.post<Comprobante>(this.apiUrl, comprobante);
  }
}