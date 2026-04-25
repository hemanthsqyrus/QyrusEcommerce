package com.ecommerce.controller;

import com.ecommerce.dto.AddToCartRequest;
import com.ecommerce.dto.CartItemResponse;
import com.ecommerce.dto.ClearCartRequest;
import com.ecommerce.dto.RemoveFromCartRequest;
import com.ecommerce.dto.UpdateCartItemQuantityRequest;
import com.ecommerce.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ShoppingCartController {
    private final CartService cartService;

    @GetMapping({"/get-cart", "/get-cart/"})
    public ResponseEntity<Map<String, Object>> getCart(@RequestParam String email) {
        log.info("Fetching cart for user: {}", email);
        List<CartItemResponse> cart = cartService.getCartItems(email);
        
        Map<String, Object> response = new HashMap<>();
        response.put("email", email);
        response.put("cart", cart);
        return ResponseEntity.ok(response);
    }

    @PostMapping({"/add-to-cart", "/add-to-cart/"})
    public ResponseEntity<Map<String, Object>> addToCart(@RequestBody AddToCartRequest request) {
        log.info("Adding item to cart: {}", request);
        
        if (request == null || request.getEmail() == null || request.getProductId() == null) {
            throw new IllegalArgumentException("Email and productId are required");
        }
        
        String message = cartService.addToCart(
            request.getEmail(), 
            request.getProductId(), 
            request.getColor(), 
            request.getProvider(), 
            request.getSize(), 
            request.getQuantity()
        );
        
        List<CartItemResponse> updatedCart = cartService.getCartItems(request.getEmail());
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", message);
        response.put("cart", updatedCart);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping({"/remove-from-cart", "/remove-from-cart/"})
    public ResponseEntity<Map<String, Object>> removeFromCart(@RequestBody RemoveFromCartRequest request) {
        if (request == null || request.getEmail() == null || request.getCartItemId() == null) {
            throw new IllegalArgumentException("Email and cartItemId are required");
        }
        
        log.info("Removing item {} from cart for user {}", request.getCartItemId(), request.getEmail());
        cartService.removeFromCart(request.getEmail(), request.getCartItemId());
        List<CartItemResponse> updatedCart = cartService.getCartItems(request.getEmail());
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Item removed from cart successfully");
        response.put("cart", updatedCart);
        return ResponseEntity.ok(response);
    }

    @PutMapping({"/update-cart-item-quantity", "/update-cart-item-quantity/"})
    public ResponseEntity<Map<String, Object>> updateCartItemQuantity(@RequestBody UpdateCartItemQuantityRequest request) {
        if (request == null || request.getEmail() == null || request.getCartItemId() == null) {
            throw new IllegalArgumentException("Email and cartItemId are required");
        }

        log.info("Updating cart item {} quantity to {} for user {}", request.getCartItemId(), request.getQuantity(), request.getEmail());
        cartService.updateCartItemQuantity(request.getEmail(), request.getCartItemId(), request.getQuantity());
        List<CartItemResponse> updatedCart = cartService.getCartItems(request.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Cart item quantity updated successfully");
        response.put("cart", updatedCart);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping({"/clear-cart", "/clear-cart/"})
    public ResponseEntity<Map<String, Object>> clearCart(@RequestBody ClearCartRequest request) {
        if (request == null || request.getEmail() == null) {
            throw new IllegalArgumentException("Email is required");
        }

        log.info("Clearing cart for user {}", request.getEmail());
        cartService.clearCart(request.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Cart cleared successfully");
        response.put("cart", cartService.getCartItems(request.getEmail()));
        return ResponseEntity.ok(response);
    }
} 
