import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactRequest {
  nombre: string;
  correo: string;
  telefono: string;
  servicio: string;
  mensaje: string;
}

export interface ContactResponse {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  servicio: string;
  mensaje: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private base = 'https://multisegma-sac-production.up.railway.app/api/contacts';

  constructor(private http: HttpClient) {}

  createContact(payload: ContactRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.base, payload);
  }

  listContacts(): Observable<ContactResponse[]> {
    return this.http.get<ContactResponse[]>(this.base);
  }
}