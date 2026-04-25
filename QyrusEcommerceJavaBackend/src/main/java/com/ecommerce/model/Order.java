package com.ecommerce.model;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "orders")
public class Order {
    @Id
    private String id;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "address_id")
    private Address address;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> items;
    
    private String paymentMethod;
    private String idempotencyKey;
    private Double subtotal;
    private Double tax;
    private Double shipping;
    private Double total;
    private String status;
    private LocalDateTime createdAt;
    
    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
} 
