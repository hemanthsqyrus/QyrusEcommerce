package com.ecommerce.service;

import com.ecommerce.dto.CreateOrderRequest;
import com.ecommerce.model.*;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private static final BigDecimal TAX_RATE = new BigDecimal("0.18");
    private static final BigDecimal FREE_SHIPPING_SUBTOTAL = new BigDecimal("500");
    private static final BigDecimal FLAT_SHIPPING_FEE = new BigDecimal("40");

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final ProductRepository productRepository;

    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));

        Address address = addressRepository.findByIdAndUser(request.getAddressId(), user)
            .orElseThrow(() -> new RuntimeException("Address not found"));

        if (request.getProducts() == null || request.getProducts().isEmpty()) {
            throw new RuntimeException("At least one product is required");
        }

        String idempotencyKey = request.getIdempotencyKey() == null ? null : request.getIdempotencyKey().trim();
        if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
            Order existingOrder = orderRepository.findByUserAndIdempotencyKey(user, idempotencyKey).orElse(null);
            if (existingOrder != null) {
                return existingOrder;
            }
        } else {
            idempotencyKey = null;
        }

        Order order = new Order();
        order.setUser(user);
        order.setAddress(address);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setIdempotencyKey(idempotencyKey);
        order.setStatus("confirmed");

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CreateOrderRequest.ProductOrder productOrder : request.getProducts()) {
            Product product = productRepository.findById(productOrder.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));
            if (product.getPrice() == null) {
                throw new RuntimeException("Product price not found");
            }

            int quantity = productOrder.getQuantity() == null ? 1 : productOrder.getQuantity();
            if (quantity <= 0) {
                throw new RuntimeException("Quantity must be greater than zero");
            }

            BigDecimal unitPrice = roundMoney(BigDecimal.valueOf(product.getPrice()));
            BigDecimal lineTotal = roundMoney(unitPrice.multiply(BigDecimal.valueOf(quantity)));
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(quantity);
            orderItem.setProductName(product.getName());
            orderItem.setProductImage(product.getImage());
            orderItem.setUnitPrice(unitPrice.doubleValue());
            orderItem.setLineTotal(lineTotal.doubleValue());
            orderItem.setColor(productOrder.getColor() == null ? "" : productOrder.getColor());
            orderItem.setSize(productOrder.getSize() == null ? "" : productOrder.getSize());
            orderItem.setProvider(productOrder.getProvider() == null ? "" : productOrder.getProvider());
            orderItems.add(orderItem);
        }

        subtotal = roundMoney(subtotal);
        BigDecimal tax = roundMoney(subtotal.multiply(TAX_RATE));
        BigDecimal shipping = subtotal.compareTo(FREE_SHIPPING_SUBTOTAL) >= 0 ? BigDecimal.ZERO : FLAT_SHIPPING_FEE;
        shipping = roundMoney(shipping);
        BigDecimal total = roundMoney(subtotal.add(tax).add(shipping));

        order.setSubtotal(subtotal.doubleValue());
        order.setTax(tax.doubleValue());
        order.setShipping(shipping.doubleValue());
        order.setTotal(total.doubleValue());
        order.setItems(orderItems);
        return orderRepository.save(order);
    }

    public List<Order> getOrders(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return orderRepository.findByUser(user);
    }

    @Transactional
    public Order cancelOrder(String orderId, String email) {
        // First find the order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));
        
        // Check if the order belongs to the user with the given email
        // This is a more lenient approach that doesn't require finding the user first
        if (!order.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Order does not belong to user with email: " + email);
        }
        
        // Update the order status
        order.setStatus("cancelled");
        return orderRepository.save(order);
    }

    private BigDecimal roundMoney(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
