package com.ecommerce.controller;

import com.ecommerce.model.Product;
import com.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping("/get-products")
    public ResponseEntity<Map<String, Object>> getProducts(
            @RequestParam String category,
            @RequestParam(required = false) String subcategory,
            @RequestParam int page) {
        
        Page<Product> productPage = productService.getProducts(category, subcategory, page);
        
        Map<String, Object> response = new HashMap<>();
        response.put("products", productPage.getContent());
        response.put("total_pages", productPage.getTotalPages());
        return ResponseEntity.ok(response);
    }

    @GetMapping({"/search-products", "/search-products/"})
    public ResponseEntity<Map<String, Object>> searchProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "page_size", defaultValue = "15") int pageSize,
            @RequestParam(name = "sort_by", defaultValue = "name") String sortBy,
            @RequestParam(name = "sort_order", defaultValue = "asc") String sortOrder,
            @RequestParam(name = "min_price", required = false) Double minPrice,
            @RequestParam(name = "max_price", required = false) Double maxPrice,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String subcategory) {
        Page<Product> productPage;
        try {
            productPage = productService.searchProducts(
                query,
                page,
                pageSize,
                sortBy,
                sortOrder,
                minPrice,
                maxPrice,
                category,
                subcategory
            );
        } catch (IllegalArgumentException ex) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("detail", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("products", productPage.getContent());
        response.put("total_items", productPage.getTotalElements());
        response.put("total_pages", productPage.getTotalPages());
        response.put("page", page);
        response.put("page_size", pageSize);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/get-product-details/{productId}")
    public ResponseEntity<Product> getProductDetails(@PathVariable Long productId) {
        Product product = productService.getProductDetails(productId);
        return ResponseEntity.ok(product);
    }
} 
