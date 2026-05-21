package com.lisume.backend.controller;

import com.lisume.backend.dto.ContactRequest;
import com.lisume.backend.model.Contact;
import com.lisume.backend.repo.ContactRepository;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/contacts")
public class ContactsController {

    private final ContactRepository repo;

    public ContactsController(ContactRepository repo) {
        this.repo = repo;
    }

    // Últimos 20 contactos (ord. desc por fecha)
    @GetMapping
    public List<Contact> list() {
        return repo.findTop20ByOrderByCreatedAtDesc();
    }

    // Crear contacto usando DTO con validación
    @PostMapping
    public Contact create(@Valid @RequestBody ContactRequest req) {
        Contact c = new Contact();
        c.setNombre(req.getNombre());
        c.setCorreo(req.getCorreo());
        c.setTelefono(req.getTelefono());
        c.setServicio(req.getServicio());
        c.setMensaje(req.getMensaje());
        return repo.save(c);
    }
}
