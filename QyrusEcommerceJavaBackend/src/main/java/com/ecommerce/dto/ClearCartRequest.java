package com.ecommerce.dto;

import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotNull;

@Data
public class ClearCartRequest {
    @NotNull(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
}
