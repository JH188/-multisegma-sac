package com.lisume.backend.dto;

import java.math.BigDecimal;

public class OrderItemDto {

    private Long productId;
    private String nombre;
    private Integer cantidad;
    private BigDecimal precio;
    private BigDecimal subtotal;

    public OrderItemDto() {
    }

    public Long getProductId() {
        return productId;
    }

    public String getNombre() {
        return nombre;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
}