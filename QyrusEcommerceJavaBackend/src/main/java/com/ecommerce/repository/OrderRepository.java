package com.ecommerce.repository;

import com.ecommerce.model.Order;
import com.ecommerce.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByUser(User user);
    Optional<Order> findByIdAndUser(String id, User user);
    Optional<Order> findByUserAndIdempotencyKey(User user, String idempotencyKey);
}
