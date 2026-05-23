package com.lisume.backend.controller;

import com.lisume.backend.model.Comprobante;
import com.lisume.backend.repository.ComprobanteRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comprobantes")
@CrossOrigin(origins = "*")
public class ComprobanteController {

    private final ComprobanteRepository comprobanteRepository;

    public ComprobanteController(ComprobanteRepository comprobanteRepository) {
        this.comprobanteRepository = comprobanteRepository;
    }

    @GetMapping
    public List<Comprobante> listarComprobantes() {
        return comprobanteRepository.findAll();
    }

    @GetMapping("/order/{orderId}")
    public List<Comprobante> listarPorPedido(@PathVariable Long orderId) {
        return comprobanteRepository.findByOrderId(orderId);
    }

    @PostMapping
    public Comprobante crearComprobante(@RequestBody Comprobante comprobante) {
        return comprobanteRepository.save(comprobante);
    }
}