package com.lisume.backend.controller;

import com.lisume.backend.model.User;
import com.lisume.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
        crearAdminSiNoExiste();
    }

    private void crearAdminSiNoExiste() {
        String adminEmail = "admin@multisegma.com";

        if (!userRepository.existsByEmailIgnoreCase(adminEmail)) {
            User admin = new User();
            admin.setName("Administrador Multisegma");
            admin.setEmail(adminEmail);
            admin.setPassword("admin123");
            admin.setRole("admin");
            admin.setCreatedAt(LocalDateTime.now());

            userRepository.save(admin);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String name = limpiar(body.get("name"));
        String nombre = limpiar(body.get("nombre"));
        String email = limpiar(body.get("email")).toLowerCase();
        String correo = limpiar(body.get("correo")).toLowerCase();
        String password = limpiar(body.get("password"));

        if (name.isBlank() && !nombre.isBlank()) {
            name = nombre;
        }

        if (email.isBlank() && !correo.isBlank()) {
            email = correo;
        }

        if (name.isBlank() || email.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Nombre, correo y contraseña son obligatorios.")
            );
        }

        if (!email.contains("@")) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Correo no válido.")
            );
        }

        if (password.length() < 6) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "La contraseña debe tener mínimo 6 caracteres.")
            );
        }

        if (userRepository.existsByEmailIgnoreCase(email)) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Ya existe una cuenta registrada con este correo.")
            );
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(password);
        user.setRole("user");
        user.setCreatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);

        return ResponseEntity.ok(usuarioSeguro(saved));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = limpiar(body.get("email")).toLowerCase();
        String correo = limpiar(body.get("correo")).toLowerCase();
        String password = limpiar(body.get("password"));

        if (email.isBlank() && !correo.isBlank()) {
            email = correo;
        }

        if (email.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Correo y contraseña son obligatorios.")
            );
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (user == null || !user.getPassword().equals(password)) {
            return ResponseEntity.status(401).body(
                    Map.of("message", "Credenciales incorrectas.")
            );
        }

        return ResponseEntity.ok(usuarioSeguro(user));
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<Map<String, Object>> users = userRepository.findAll()
                .stream()
                .map(this::usuarioSeguro)
                .toList();

        return ResponseEntity.ok(users);
    }

    private String limpiar(String value) {
        return value == null ? "" : value.trim();
    }

    private Map<String, Object> usuarioSeguro(User user) {
        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "nombre", user.getName(),
                "email", user.getEmail(),
                "correo", user.getEmail(),
                "role", user.getRole(),
                "rol", user.getRole(),
                "createdAt", user.getCreatedAt()
        );
    }
}