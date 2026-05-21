package com.lisume.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    // Configura tu número en application.properties: app.whatsapp.number=+51910006174
    @Value("${app.whatsapp.number:+51998311743}")
    private String whatsapp;

    // ====== DTOs (Java records) ======
    public record Item(String name, int qty, double price) {}
    public record CheckoutRequest(String customer, String phone, List<Item> items) {}
    public record CheckoutResponse(String whatsappUrl) {}

    @PostMapping("/checkout")
    public ResponseEntity<CheckoutResponse> checkout(@RequestBody CheckoutRequest req) {
        String customer = (req.customer() == null || req.customer().isBlank()) ? "cliente" : req.customer();

        StringBuilder sb = new StringBuilder();
        sb.append("Hola, soy ").append(customer).append(".%0A");
        sb.append("Pedido LISUME:%0A");

        double total = 0.0;
        if (req.items() != null) {
            for (Item it : req.items()) {
                if (it == null) continue;
                int qty = Math.max(it.qty(), 1);
                double line = qty * it.price();
                total += line;
                sb.append("- ").append(it.name() == null ? "Item" : it.name())
                  .append(" x").append(qty)
                  .append(" = S/ ").append(String.format("%.2f", line))
                  .append("%0A");
            }
        }
        sb.append("Total: S/ ").append(String.format("%.2f", total)).append("%0A");

        if (req.phone() != null && !req.phone().isBlank()) {
            sb.append("Teléfono: ").append(req.phone()).append("%0A");
        }

        // Construir URL de WhatsApp
        String encodedText = URLEncoder.encode(sb.toString(), StandardCharsets.UTF_8);
        String url = "https://wa.me/" + whatsapp.replace("+", "") + "?text=" + encodedText;

        return ResponseEntity.ok(new CheckoutResponse(url));
    }
}
