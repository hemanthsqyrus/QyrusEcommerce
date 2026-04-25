package com.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Data
public class UpdateCartItemQuantityRequest {
    @NotNull(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotNull(message = "Cart item ID is required")
    @JsonProperty("cart_item_id")
    private String cartItemId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;
}
