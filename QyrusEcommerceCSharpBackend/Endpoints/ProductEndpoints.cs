using QyrusEcommerceCSharpBackend.Models;
using QyrusEcommerceCSharpBackend.Data;
using Microsoft.AspNetCore.Mvc;

namespace QyrusEcommerceCSharpBackend.Endpoints;

public static class ProductEndpoints {
    public static void MapProductEndpoints(this IEndpointRouteBuilder app) {
        app.MapGet("/get-products/", ([FromQuery] string category, [FromQuery] string? subcategory, [FromQuery] int page) => {
            var filtered = DataStore.ProductsDb.Where(p => 
                p.Category.Equals(category, StringComparison.OrdinalIgnoreCase) &&
                (string.IsNullOrEmpty(subcategory) || subcategory.Equals("none", StringComparison.OrdinalIgnoreCase) || p.Subcategory.Equals(subcategory, StringComparison.OrdinalIgnoreCase))
            ).ToList();
            
            var pageSize = 15;
            var start = (page - 1) * pageSize;
            var totalPages = (filtered.Count + pageSize - 1) / pageSize;
            var paginated = filtered.Skip(start).Take(pageSize).ToList();
            
            return Results.Ok(new { products = paginated, total_pages = totalPages });
        });
        
        app.MapGet("/search-products/", (
            [FromQuery] string query,
            [FromQuery] int page = 1,
            [FromQuery(Name = "page_size")] int pageSize = 15,
            [FromQuery(Name = "sort_by")] string sortBy = "name",
            [FromQuery(Name = "sort_order")] string sortOrder = "asc",
            [FromQuery(Name = "min_price")] decimal? minPrice = null,
            [FromQuery(Name = "max_price")] decimal? maxPrice = null,
            [FromQuery] string? category = null,
            [FromQuery] string? subcategory = null
        ) => {
            if (page < 1) {
                return Results.BadRequest(new { detail = "page must be greater than or equal to 1" });
            }

            if (pageSize < 1 || pageSize > 100) {
                return Results.BadRequest(new { detail = "page_size must be between 1 and 100" });
            }

            if (minPrice.HasValue && maxPrice.HasValue && minPrice.Value > maxPrice.Value) {
                return Results.BadRequest(new { detail = "min_price cannot be greater than max_price" });
            }

            var allowedSortFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase) {
                "id", "name", "price", "category", "subcategory", "rating"
            };
            if (!allowedSortFields.Contains(sortBy)) {
                return Results.BadRequest(new { detail = "Invalid sort_by. Allowed values: category, id, name, price, rating, subcategory" });
            }

            var normalizedSortOrder = sortOrder.ToLowerInvariant();
            if (normalizedSortOrder is not ("asc" or "desc")) {
                return Results.BadRequest(new { detail = "sort_order must be either 'asc' or 'desc'" });
            }

            var filtered = DataStore.ProductsDb.Where(p =>
                p.Name.Contains(query, StringComparison.OrdinalIgnoreCase)
            );

            if (!string.IsNullOrWhiteSpace(category) &&
                !category.Equals("none", StringComparison.OrdinalIgnoreCase) &&
                !category.Equals("all", StringComparison.OrdinalIgnoreCase)) {
                filtered = filtered.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(subcategory) &&
                !subcategory.Equals("none", StringComparison.OrdinalIgnoreCase) &&
                !subcategory.Equals("all", StringComparison.OrdinalIgnoreCase)) {
                filtered = filtered.Where(p => p.Subcategory.Equals(subcategory, StringComparison.OrdinalIgnoreCase));
            }

            if (minPrice.HasValue) {
                filtered = filtered.Where(p => p.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue) {
                filtered = filtered.Where(p => p.Price <= maxPrice.Value);
            }

            var isDescending = normalizedSortOrder == "desc";
            var sorted = sortBy.ToLowerInvariant() switch {
                "id" => isDescending ? filtered.OrderByDescending(p => p.Id) : filtered.OrderBy(p => p.Id),
                "price" => isDescending ? filtered.OrderByDescending(p => p.Price) : filtered.OrderBy(p => p.Price),
                "category" => isDescending
                    ? filtered.OrderByDescending(p => p.Category.ToLowerInvariant())
                    : filtered.OrderBy(p => p.Category.ToLowerInvariant()),
                "subcategory" => isDescending
                    ? filtered.OrderByDescending(p => p.Subcategory.ToLowerInvariant())
                    : filtered.OrderBy(p => p.Subcategory.ToLowerInvariant()),
                "rating" => isDescending ? filtered.OrderByDescending(p => p.Rating ?? 0) : filtered.OrderBy(p => p.Rating ?? 0),
                _ => isDescending
                    ? filtered.OrderByDescending(p => p.Name.ToLowerInvariant())
                    : filtered.OrderBy(p => p.Name.ToLowerInvariant()),
            };

            var totalItems = sorted.Count();
            var totalPages = totalItems == 0 ? 0 : (totalItems + pageSize - 1) / pageSize;
            var paginated = sorted.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            return Results.Ok(new {
                products = paginated,
                total_items = totalItems,
                total_pages = totalPages,
                page,
                page_size = pageSize
            });
        });
        
        app.MapGet("/get-product-categories/", () => {
            return Results.Ok(new { categories = DataStore.ProductCategories });
        });
        
        app.MapGet("/get-product-details/{productId}", (int productId) => {
            var product = DataStore.ProductsDb.FirstOrDefault(p => p.Id == productId);
            if (product != null) {
                return Results.Ok(product); // Assuming exact match format
            }
            return Results.Json(new { detail = "Product not found" }, statusCode: 404);
        });
    }
}
