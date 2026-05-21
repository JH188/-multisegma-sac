package com.lisume.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class OrderRequest {

    // Datos del cliente
    @NotBlank
    private String customerName;

    private String customerEmail;
    private String customerPhone;

    // Dirección
    private String departamento;
    private String provincia;
    private String distrito;
    private String direccion;
    private String referencia;

    // Pago
    @NotBlank
    private String paymentMethod;

    @NotNull
    private BigDecimal total;

    // Detalle del carrito
    @NotNull
    private List<OrderItemDto> items;

    public OrderRequest() {
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public String getDepartamento() {
        return departamento;
    }

    public String getProvincia() {
        return provincia;
    }

    public String getDistrito() {
        return distrito;
    }

    public String getDireccion() {
        return direccion;
    }

    public String getReferencia() {
        return referencia;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }

    public void setProvincia(String provincia) {
        this.provincia = provincia;
    }

    public void setDistrito(String distrito) {
        this.distrito = distrito;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public void setItems(List<OrderItemDto> items) {
        this.items = items;
    }
}