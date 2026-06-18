package com.lisume.backend.controller;

import com.lisume.backend.dto.ForgotPasswordRequest;
import com.lisume.backend.dto.ResetPasswordRequest;
import com.lisume.backend.model.PasswordResetCode;
import com.lisume.backend.model.User;
import com.lisume.backend.repository.PasswordResetCodeRepository;
import com.lisume.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordResetCodeRepository passwordResetCodeRepository;

    private final SecureRandom random = new SecureRandom();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${app.mail.from}")
    private String mailFrom;

    @Value("${app.mail.from-name:MULTISEGMA S.A.C.}")
    private String mailFromName;

    public AuthController(
            UserRepository userRepository,
            PasswordResetCodeRepository passwordResetCodeRepository
    ) {
        this.userRepository = userRepository;
        this.passwordResetCodeRepository = passwordResetCodeRepository;
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

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        String email = limpiar(request.getEmail()).toLowerCase();

        if (email.isBlank() || !email.contains("@")) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Correo no válido.")
            );
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (user == null) {
            return ResponseEntity.ok(
                    Map.of("message", "Si el correo está registrado, se enviará un código de recuperación.")
            );
        }

        String code = generarCodigo();

        PasswordResetCode resetCode = new PasswordResetCode(
                email,
                code,
                LocalDateTime.now().plusMinutes(10)
        );

        passwordResetCodeRepository.save(resetCode);

        enviarCorreoRecuperacion(email, code);

        return ResponseEntity.ok(
                Map.of("message", "Se envió un código de recuperación a tu correo.")
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        String email = limpiar(request.getEmail()).toLowerCase();
        String code = limpiar(request.getCode());
        String newPassword = limpiar(request.getNewPassword());

        if (email.isBlank() || code.isBlank() || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Correo, código y nueva contraseña son obligatorios.")
            );
        }

        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "La contraseña debe tener mínimo 6 caracteres.")
            );
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Correo no registrado.")
            );
        }

        PasswordResetCode resetCode = passwordResetCodeRepository
                .findTopByEmailAndCodeAndUsedFalseOrderByIdDesc(email, code)
                .orElse(null);

        if (resetCode == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Código inválido.")
            );
        }

        if (resetCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "El código expiró. Solicita uno nuevo.")
            );
        }

        user.setPassword(newPassword);
        userRepository.save(user);

        resetCode.setUsed(true);
        passwordResetCodeRepository.save(resetCode);

        return ResponseEntity.ok(
                Map.of("message", "Contraseña actualizada correctamente.")
        );
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<Map<String, Object>> users = userRepository.findAll()
                .stream()
                .map(this::usuarioSeguro)
                .toList();

        return ResponseEntity.ok(users);
    }

    private String generarCodigo() {
        int number = 100000 + random.nextInt(900000);
        return String.valueOf(number);
    }

    private void enviarCorreoRecuperacion(String email, String code) {
        String url = "https://api.brevo.com/v3/smtp/email";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);

        String htmlContent =
                "<h2>Recuperación de contraseña - MULTISEGMA S.A.C.</h2>" +
                "<p>Recibimos una solicitud para restablecer tu contraseña.</p>" +
                "<p>Tu código de recuperación es:</p>" +
                "<h1 style='color:#ff7a1a;'>" + code + "</h1>" +
                "<p>Este código vence en 10 minutos.</p>" +
                "<p>Si no solicitaste este cambio, ignora este mensaje.</p>";

        Map<String, Object> body = Map.of(
                "sender", Map.of(
                        "name", mailFromName,
                        "email", mailFrom
                ),
                "to", List.of(
                        Map.of("email", email)
                ),
                "subject", "Código de recuperación - MULTISEGMA S.A.C.",
                "htmlContent", htmlContent
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                url,
                request,
                String.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("No se pudo enviar el correo de recuperación.");
        }
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