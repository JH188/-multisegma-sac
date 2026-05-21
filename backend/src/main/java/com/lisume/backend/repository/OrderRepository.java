package com.lisume.backend.repository;

import com.lisume.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Para listar ordenado por id (como en tu tabla)
    List<Order> findAllByOrderByIdAsc();
}
