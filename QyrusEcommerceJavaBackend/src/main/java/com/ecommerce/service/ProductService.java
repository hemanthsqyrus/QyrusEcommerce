package com.ecommerce.service;

import com.ecommerce.model.Product;
import com.ecommerce.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.Map;
import java.util.Set;

@Service
public class ProductService {
    private final ProductRepository productRepository;

    @Autowired
    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Page<Product> getProducts(String category, String subcategory, int page) {
        PageRequest pageRequest = PageRequest.of(page - 1, 15);
        
        if (subcategory == null || subcategory.equals("none")) {
            return productRepository.findByCategory(category, pageRequest);
        }
        return productRepository.findByCategoryAndSubcategory(category, subcategory, pageRequest);
    }

    public Page<Product> searchProducts(
            String query,
            int page,
            int pageSize,
            String sortBy,
            String sortOrder,
            Double minPrice,
            Double maxPrice,
            String category,
            String subcategory) {
        if (page < 1) {
            throw new IllegalArgumentException("page must be greater than or equal to 1");
        }

        if (pageSize < 1 || pageSize > 100) {
            throw new IllegalArgumentException("page_size must be between 1 and 100");
        }

        if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            throw new IllegalArgumentException("min_price cannot be greater than max_price");
        }

        String normalizedSortBy = sortBy == null ? "name" : sortBy.toLowerCase();
        Set<String> allowedSortFields = Set.of("id", "name", "price", "category", "subcategory", "rating");
        if (!allowedSortFields.contains(normalizedSortBy)) {
            throw new IllegalArgumentException("Invalid sort_by. Allowed values: category, id, name, price, rating, subcategory");
        }

        String normalizedSortOrder = sortOrder == null ? "asc" : sortOrder.toLowerCase();
        if (!normalizedSortOrder.equals("asc") && !normalizedSortOrder.equals("desc")) {
            throw new IllegalArgumentException("sort_order must be either 'asc' or 'desc'");
        }

        Map<String, String> sortFieldMapping = Map.of(
            "id", "id",
            "name", "name",
            "price", "price",
            "category", "category",
            "subcategory", "subcategory",
            "rating", "rating"
        );
        String sortField = sortFieldMapping.get(normalizedSortBy);
        Sort sort = normalizedSortOrder.equals("desc")
            ? Sort.by(sortField).descending()
            : Sort.by(sortField).ascending();

        PageRequest pageRequest = PageRequest.of(page - 1, pageSize, sort);
        return productRepository.searchProducts(query, category, subcategory, minPrice, maxPrice, pageRequest);
    }

    public Product getProductDetails(Long productId) {
        return productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));
    }
} 
