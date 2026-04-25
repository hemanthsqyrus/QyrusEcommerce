package com.ecommerce.repository;

import com.ecommerce.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByCategoryAndSubcategory(String category, String subcategory, Pageable pageable);
    Page<Product> findByCategory(String category, Pageable pageable);
    
    @Query(
        value = "SELECT p FROM Product p " +
                "WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
                "AND (:category IS NULL OR LOWER(:category) IN ('none', 'all') OR LOWER(p.category) = LOWER(:category)) " +
                "AND (:subcategory IS NULL OR LOWER(:subcategory) IN ('none', 'all') OR LOWER(p.subcategory) = LOWER(:subcategory)) " +
                "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
                "AND (:maxPrice IS NULL OR p.price <= :maxPrice)",
        countQuery = "SELECT COUNT(p) FROM Product p " +
                     "WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
                     "AND (:category IS NULL OR LOWER(:category) IN ('none', 'all') OR LOWER(p.category) = LOWER(:category)) " +
                     "AND (:subcategory IS NULL OR LOWER(:subcategory) IN ('none', 'all') OR LOWER(p.subcategory) = LOWER(:subcategory)) " +
                     "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
                     "AND (:maxPrice IS NULL OR p.price <= :maxPrice)"
    )
    Page<Product> searchProducts(
        @Param("query") String query,
        @Param("category") String category,
        @Param("subcategory") String subcategory,
        @Param("minPrice") Double minPrice,
        @Param("maxPrice") Double maxPrice,
        Pageable pageable
    );
}
