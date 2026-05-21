import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService, ContactRequest } from '../../services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss']
})
export class ContactComponent {
  nombre = '';
  correo = '';
  telefono = '';
  servicio = '';
  mensaje = '';

  ok = '';
  err = '';

  constructor(private api: ContactService) {}

  send() {
    this.ok = '';
    this.err = '';

    // Validación rápida en el cliente (evita 400 por campos vacíos)
    if (!this.nombre || !this.correo || !this.telefono || !this.servicio || !this.mensaje) {
      this.err = 'Completa todos los campos.';
      return;
    }

    const payload: ContactRequest = {
      nombre: this.nombre.trim(),
      correo: this.correo.trim(),
      telefono: this.telefono.trim(),
      servicio: this.servicio,     // viene del <select>
      mensaje: this.mensaje.trim(),
    };

    this.api.createContact(payload).subscribe({
      next: (r) => {
        this.ok = r?.message || 'Enviado';
        // limpia el formulario
        this.nombre = this.correo = this.telefono = this.mensaje = '';
        this.servicio = '';
      },
      error: (e) => {
        // si el backend envía 400 con mensajes de validación
        this.err = e?.error?.message || 'Error al enviar';
      }
    });
  }
}
