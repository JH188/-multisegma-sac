package com.lisume.backend.controller;

import com.lisume.backend.dto.ForgotPasswordRequest;
import com.lisume.backend.dto.ResetPasswordRequest;
import com.lisume.backend.model.PasswordResetCode;
import com.lisume.backend.model.User;
import com.lisume.backend.repository.PasswordResetCodeRepository;
import com.lisume.backend.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

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
    private final JavaMailSender mailSender;

    private final SecureRandom random = new SecureRandom();

    public AuthController(
            UserRepository userRepository,
            PasswordResetCodeRepository passwordResetCodeRepository,
            JavaMailSender mailSender
    ) {
        this.userRepository = userRepository;
        this.passwordResetCodeRepository = passwordResetCodeRepository;
        this.mailSender = mailSender;
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

    // ==============================
    // RECUPERAR CONTRASEÑA - ENVIAR CÓDIGO
    // POST /api/auth/forgot-password
    // ==============================
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

    // ==============================
    // RESTABLECER CONTRASEÑA CON CÓDIGO
    // POST /api/auth/reset-password
    // ==============================
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
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Código de recuperación - MULTISEGMA S.A.C.");
        message.setText(
                "Hola,\n\n" +
                "Recibimos una solicitud para restablecer tu contraseña en MULTISEGMA S.A.C.\n\n" +
                "Tu código de recuperación es: " + code + "\n\n" +
                "Este código vence en 10 minutos.\n\n" +
                "Si no solicitaste este cambio, ignora este mensaje.\n\n" +
                "MULTISEGMA S.A.C."
        );

        mailSender.send(message);
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