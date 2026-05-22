package com.lisume.backend.controller;

import com.lisume.backend.dto.OrderItemDto;
import com.lisume.backend.dto.OrderRequest;
import com.lisume.backend.model.Order;
import com.lisume.backend.model.OrderItem;
import com.lisume.backend.model.Payment;
import com.lisume.backend.repository.OrderItemRepository;
import com.lisume.backend.repository.OrderRepository;
import com.lisume.backend.repository.PaymentRepository;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(originPatterns = "*")
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;

    public OrderController(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            PaymentRepository paymentRepository
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
    }

    // LISTAR PEDIDOS PARA ADMIN
@GetMapping
public List<Order> list() {
    return orderRepository.findAllByOrderByIdAsc();
}

// LISTAR PEDIDOS POR CORREO DEL CLIENTE
@GetMapping("/customer/{email}")
public List<Order> getByCustomerEmail(@PathVariable String email) {
    return orderRepository.findByCustomerEmailOrderByIdDesc(email);
}
    // VER PEDIDO POR ID
    @GetMapping("/{id}")
    public ResponseEntity<Order> getById(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // VER PRODUCTOS DE UN PEDIDO
    @GetMapping("/{id}/items")
    public List<OrderItem> getOrderItems(@PathVariable Long id) {
        return orderItemRepository.findByOrderId(id);
    }

    // VER PAGOS DE UN PEDIDO
    @GetMapping("/{id}/payments")
    public List<Payment> getOrderPayments(@PathVariable Long id) {
        return paymentRepository.findByOrderId(id);
    }

    // CREAR PEDIDO DESDE CHECKOUT
    @PostMapping
    public Order create(@Valid @RequestBody OrderRequest dto) {

        String detail = dto.getItems().stream()
                .map(i -> i.getNombre() + " x" + i.getCantidad() + " - S/ " + i.getPrecio())
                .collect(Collectors.joining("\n"));

        Order order = new Order();

        order.setCustomerName(dto.getCustomerName());
        order.setCustomerEmail(dto.getCustomerEmail());
        order.setCustomerPhone(dto.getCustomerPhone());

        order.setDepartamento(dto.getDepartamento());
        order.setProvincia(dto.getProvincia());
        order.setDistrito(dto.getDistrito());
        order.setDireccion(dto.getDireccion());
        order.setReferencia(dto.getReferencia());

        order.setPaymentMethod(dto.getPaymentMethod());
        order.setTotal(dto.getTotal());
        order.setDetail(detail);
        order.setStatus("PENDIENTE");

        // 1. Guardamos el pedido principal
        Order savedOrder = orderRepository.save(order);

        // 2. Guardamos los productos del pedido
        for (OrderItemDto itemDto : dto.getItems()) {
            OrderItem item = new OrderItem();

            item.setOrderId(savedOrder.getId());
            item.setProductId(itemDto.getProductId());
            item.setProductName(itemDto.getNombre());

            BigDecimal precio = itemDto.getPrecio();
            Integer cantidad = itemDto.getCantidad();

            if (precio == null) {
                precio = BigDecimal.ZERO;
            }

            if (cantidad == null || cantidad <= 0) {
                cantidad = 1;
            }

            BigDecimal subtotal;

            if (itemDto.getSubtotal() != null) {
                subtotal = itemDto.getSubtotal();
            } else {
                subtotal = precio.multiply(BigDecimal.valueOf(cantidad));
            }

            item.setQuantity(cantidad);
            item.setUnitPrice(precio);
            item.setSubtotal(subtotal);

            orderItemRepository.save(item);
        }

        // 3. Creamos el pago del pedido
        Payment payment = new Payment();

        payment.setOrderId(savedOrder.getId());
        payment.setMethod(dto.getPaymentMethod());
        payment.setAmount(dto.getTotal());
        payment.setStatus("PENDIENTE");

        paymentRepository.save(payment);

        return savedOrder;
    }

    // CAMBIAR ESTADO DEL PEDIDO DESDE ADMIN
    @PutMapping("/{id}/estado")
    public ResponseEntity<Order> updateEstado(
            @PathVariable Long id,
            @RequestParam String estado
    ) {
        return orderRepository.findById(id)
                .map(order -> {
                    String nuevoEstado = estado.trim().toUpperCase().replace(" ", "_");

                    if (!nuevoEstado.equals("PENDIENTE")
                            && !nuevoEstado.equals("CONFIRMADO")
                            && !nuevoEstado.equals("EN_PROCESO")
                            && !nuevoEstado.equals("CANCELADO")) {
                        nuevoEstado = "PENDIENTE";
                    }

                    order.setStatus(nuevoEstado);
                    orderRepository.save(order);

                    return ResponseEntity.ok(order);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // CAMBIAR ESTADO DEL PAGO DESDE ADMIN
    @PutMapping("/{id}/payment-status")
    public ResponseEntity<Payment> updatePaymentStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        List<Payment> payments = paymentRepository.findByOrderId(id);

        if (payments.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Payment payment = payments.get(0);

        String nuevoStatus = status.toUpperCase();

        if (!nuevoStatus.equals("PENDIENTE")
                && !nuevoStatus.equals("CONFIRMADO")
                && !nuevoStatus.equals("EN_PROCESO")
                && !nuevoStatus.equals("RECHAZADO")) {
            nuevoStatus = "PENDIENTE";
        }

        payment.setStatus(nuevoStatus);

        if (nuevoStatus.equals("CONFIRMADO")) {
            payment.setConfirmedAt(LocalDateTime.now());
        }

        paymentRepository.save(payment);

        return ResponseEntity.ok(payment);
    }
}