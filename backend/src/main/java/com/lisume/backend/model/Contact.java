package com.lisume.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contacts")
public class Contact {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 100)
  private String nombre;

  @Column(nullable = false, length = 150)
  private String correo;

  @Column(nullable = false, length = 30)
  private String telefono;

  @Column(nullable = false, length = 120)
  private String servicio; // Molde, Grabado, etc.

  @Column(nullable = false, columnDefinition = "TEXT")
  private String mensaje;

  @Column(nullable = false)
  private LocalDateTime createdAt = LocalDateTime.now();

  public Contact() {}

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getNombre() { return nombre; }
  public void setNombre(String nombre) { this.nombre = nombre; }
  public String getCorreo() { return correo; }
  public void setCorreo(String correo) { this.correo = correo; }
  public String getTelefono() { return telefono; }
  public void setTelefono(String telefono) { this.telefono = telefono; }
  public String getServicio() { return servicio; }
  public void setServicio(String servicio) { this.servicio = servicio; }
  public String getMensaje() { return mensaje; }
  public void setMensaje(String mensaje) { this.mensaje = mensaje; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
