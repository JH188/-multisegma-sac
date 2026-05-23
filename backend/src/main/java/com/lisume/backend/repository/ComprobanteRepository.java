package com.lisume.backend.repository;

import com.lisume.backend.model.Comprobante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ComprobanteRepository extends JpaRepository<Comprobante, Long> {

    List<Comprobante> findByOrderId(Long orderId);

    Optional<Comprobante> findByNumeroCompleto(String numeroCompleto);
}