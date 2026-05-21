package com.lisume.backend.controller;

import com.lisume.backend.model.Product;
import com.lisume.backend.repo.ProductRepository;
import com.lisume.backend.dto.ProductRequest;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:4200")
public class ProductsController {

    private final ProductRepository repo;

    public ProductsController(ProductRepository repo) {
        this.repo = repo;
    }

    // GET /api/products -> productos activos para el cliente
    @GetMapping
    public List<Product> listActive() {
        return repo.findByActiveTrue();
    }

    // GET /api/products/all -> todos los productos para el admin
    @GetMapping("/all")
    public List<Product> listAll() {
        return repo.findAll();
    }

    // POST /api/products -> crear producto
    @PostMapping
    public Product create(@RequestBody ProductRequest req) {
        Product p = new Product();

        p.setName(req.getName());
        p.setPrice(req.getPrice());
        p.setDescription(req.getDescription());
        p.setImageUrl(req.getImageUrl());
        p.setCategory(req.getCategory());

        if (req.getActive() == null) {
            p.setActive(true);
        } else {
            p.setActive(req.getActive());
        }

        return repo.save(p);
    }

    // PUT /api/products/{id} -> actualizar producto
    @PutMapping("/{id}")
    public Product update(@PathVariable Long id, @RequestBody ProductRequest req) {
        Product p = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        p.setName(req.getName());
        p.setPrice(req.getPrice());
        p.setDescription(req.getDescription());
        p.setImageUrl(req.getImageUrl());
        p.setCategory(req.getCategory());

        if (req.getActive() != null) {
            p.setActive(req.getActive());
        }

        return repo.save(p);
    }

    // DELETE /api/products/{id} -> ocultar producto, no borrarlo
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        Product p = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        p.setActive(false);
        repo.save(p);
    }
}