package com.ecommerce.model;

import lombok.Data;
import javax.persistence.*;

@Data
@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;
    
    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;
    
    private Integer quantity;
    private String productName;
    private String productImage;
    private Double unitPrice;
    private Double lineTotal;
    private String color;
    private String size;
    private String provider;
}
