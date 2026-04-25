package com.ecommerce.service;

import com.ecommerce.dto.CartItemResponse;
import com.ecommerce.model.CartItem;
import com.ecommerce.model.Product;
import com.ecommerce.model.User;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional
    public String addToCart(String email, Long productId, String color, String provider, String size, int quantity) {
        log.info("Adding item to cart for user: {}, product: {}", email, productId);
        if (quantity < 1) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }
        
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
            
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
            
        CartItem existingItem = findCartItemByVariant(user, productId, color, provider, size);
        if (existingItem != null) {
            // Update quantity of existing item
            existingItem.setQuantity(existingItem.getQuantity() + quantity);
            cartItemRepository.save(existingItem);
            log.info("Updated quantity of existing cart item");
            return "Item quantity updated successfully";
        } else {
            // Create new cart item
            CartItem cartItem = new CartItem();
            cartItem.setId(UUID.randomUUID().toString());
            cartItem.setUser(user);
            cartItem.setProduct(product);
            cartItem.setColor(color);
            cartItem.setProvider(provider);
            cartItem.setSize(size);
            cartItem.setQuantity(quantity);
            
            cartItemRepository.save(cartItem);
            log.info("Added new item to cart with id: {}", cartItem.getId());
            return "Item added to cart successfully";
        }
    }

    @Transactional
    public void removeFromCart(String email, String cartItemId) {
        if (email == null || cartItemId == null) {
            throw new IllegalArgumentException("Email and cartItemId must not be null");
        }

        log.info("Attempting to remove cart item: {} for user: {}", cartItemId, email);
        
        CartItem cartItem = cartItemRepository.findById(cartItemId)
            .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + cartItemId));

        if (!cartItem.getUser().getEmail().equals(email)) {
            throw new UnauthorizedException("Cart item does not belong to user");
        }

        cartItemRepository.delete(cartItem);
        cartItemRepository.flush();
        log.info("Successfully removed item from cart");
    }

    public List<CartItemResponse> getCartItems(String email) {
        log.info("Fetching cart for user {}", email);
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        return cartItemRepository.findByUser(user).stream()
            .map(this::convertToCartItemResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public void updateCartItemQuantity(String email, String cartItemId, int quantity) {
        if (email == null || cartItemId == null) {
            throw new IllegalArgumentException("Email and cartItemId must not be null");
        }
        if (quantity < 1) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }

        userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        CartItem cartItem = cartItemRepository.findById(cartItemId)
            .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + cartItemId));

        if (!cartItem.getUser().getEmail().equals(email)) {
            throw new UnauthorizedException("Cart item does not belong to user");
        }

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);
        log.info("Updated quantity for cart item {} to {}", cartItemId, quantity);
    }

    @Transactional
    public void clearCart(String email) {
        if (email == null) {
            throw new IllegalArgumentException("Email must not be null");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        List<CartItem> userItems = cartItemRepository.findByUser(user);
        if (!userItems.isEmpty()) {
            cartItemRepository.deleteAll(userItems);
            cartItemRepository.flush();
        }
        log.info("Cleared cart for user {}", email);
    }

    private CartItem findCartItemByVariant(User user, Long productId, String color, String provider, String size) {
        return cartItemRepository.findByUser(user).stream()
            .filter(item -> item.getProduct().getId().equals(productId)
                && Objects.equals(item.getColor(), color)
                && Objects.equals(item.getProvider(), provider)
                && Objects.equals(item.getSize(), size))
            .findFirst()
            .orElse(null);
    }

    private CartItemResponse convertToCartItemResponse(CartItem cartItem) {
        Product product = productRepository.findById(cartItem.getProduct().getId())
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            
        return CartItemResponse.builder()
            .cartItemId(cartItem.getId())
            .productId(product.getId())
            .name(product.getName())
            .price(product.getPrice())
            .image(product.getImage())
            .color(cartItem.getColor())
            .provider(cartItem.getProvider())
            .size(cartItem.getSize())
            .quantity(cartItem.getQuantity())
            .build();
    }
} 
