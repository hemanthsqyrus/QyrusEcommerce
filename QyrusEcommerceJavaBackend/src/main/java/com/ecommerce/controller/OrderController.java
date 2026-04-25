package com.ecommerce.controller;

import com.ecommerce.dto.CreateOrderRequest;
import com.ecommerce.model.Order;
import com.ecommerce.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;

@RestController
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(
        @Valid @RequestBody CreateOrderRequest request,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKeyHeader
    ) {
        if ((request.getIdempotencyKey() == null || request.getIdempotencyKey().trim().isEmpty())
            && idempotencyKeyHeader != null && !idempotencyKeyHeader.trim().isEmpty()) {
            request.setIdempotencyKey(idempotencyKeyHeader.trim());
        }
        Order order = orderService.createOrder(request);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Order created successfully");
        response.put("order_id", order.getId());
        response.put("order_status", order.getStatus());
        response.put("subtotal", order.getSubtotal());
        response.put("tax", order.getTax());
        response.put("shipping", order.getShipping());
        response.put("total", order.getTotal());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/get-orders")
    public ResponseEntity<Map<String, Object>> getOrders(@RequestParam String email) {
        List<Order> orders = orderService.getOrders(email);
        
        // Transform orders to match expected response format
        List<Map<String, Object>> formattedOrders = orders.stream().map(order -> {
            Map<String, Object> formattedOrder = new HashMap<>();
            formattedOrder.put("order_id", order.getId());
            formattedOrder.put("address_id", order.getAddress().getId());
            
            // Transform order items to the expected product format
            List<Map<String, Object>> products = order.getItems().stream().map(item -> {
                Map<String, Object> product = new HashMap<>();
                product.put("productId", item.getProduct() != null ? item.getProduct().getId() : null);
                product.put("name", item.getProductName());
                product.put("image", item.getProductImage());
                product.put("quantity", item.getQuantity());
                product.put("selectedColor", item.getColor());
                product.put("selectedProvider", item.getProvider());
                product.put("selectedSize", item.getSize());
                product.put("price", item.getUnitPrice());
                product.put("line_total", item.getLineTotal());
                return product;
            }).collect(java.util.stream.Collectors.toList());
            
            formattedOrder.put("products", products);
            formattedOrder.put("payment_method", order.getPaymentMethod());
            formattedOrder.put("subtotal", order.getSubtotal());
            formattedOrder.put("tax", order.getTax());
            formattedOrder.put("shipping", order.getShipping());
            formattedOrder.put("total", order.getTotal());
            formattedOrder.put("status", order.getStatus());
            formattedOrder.put("created_at", order.getCreatedAt());
            return formattedOrder;
        }).collect(java.util.stream.Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("email", email);
        response.put("orders", formattedOrders);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cancel-order")
    public ResponseEntity<?> cancelOrder(@RequestBody Map<String, String> request) {
        String orderId = request.get("orderId");
        String email = request.get("email");
        
        try {
            // Call the service to cancel the order
            Order cancelledOrder = orderService.cancelOrder(orderId, email);
            
            // Prepare the success response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Order cancelled successfully");
            response.put("order_id", cancelledOrder.getId());
            response.put("order_status", cancelledOrder.getStatus());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Prepare the error response
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Failed to cancel order: " + e.getMessage());
            errorResponse.put("order_id", orderId);
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
} 
