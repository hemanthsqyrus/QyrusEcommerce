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
        
        app.MapGet("/search-products/", ([FromQuery] string query) => {
            var filtered = DataStore.ProductsDb.Where(p => 
                p.Name.Contains(query, StringComparison.OrdinalIgnoreCase)
            ).ToList();
            return Results.Ok(new { products = filtered });
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
