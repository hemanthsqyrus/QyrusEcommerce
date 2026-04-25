package com.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Data
public class CreateOrderRequest {
    @NotNull
    private String email;
    
    @NotNull
    private String addressId;
    
    @NotNull
    private String paymentMethod;

    private String idempotencyKey;
    
    @NotEmpty
    private List<ProductOrder> products;

    @Data
    public static class ProductOrder {
        @NotNull
        @JsonAlias("product_id")
        private Long productId;
        private Integer quantity = 1;
        @JsonAlias("selectedColor")
        private String color;
        @JsonAlias("selectedSize")
        private String size;
        @JsonAlias("selectedProvider")
        private String provider;
    }
}
