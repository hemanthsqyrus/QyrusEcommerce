using QyrusEcommerceCSharpBackend.Models;
using QyrusEcommerceCSharpBackend.Data;
using Microsoft.AspNetCore.Mvc;

namespace QyrusEcommerceCSharpBackend.Endpoints;

public static class CartEndpoints {
    public static void MapCartEndpoints(this IEndpointRouteBuilder app) {
        app.MapPost("/add-to-cart/", (AddToCartRequest req) => {
            if (!DataStore.UsersDb.ContainsKey(req.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            if (req.Quantity < 1) return Results.Json(new { detail = "Quantity must be at least 1" }, statusCode: 400);
            var product = DataStore.ProductsDb.FirstOrDefault(p => p.Id == req.ProductId);
            if (product == null) return Results.Json(new { detail = "Product not found" }, statusCode: 404);
            
            if (!DataStore.CartDb.ContainsKey(req.Email)) DataStore.CartDb[req.Email] = new List<CartItem>();
            var userCart = DataStore.CartDb[req.Email];

            var existingItem = userCart.FirstOrDefault(item =>
                item.ProductId == req.ProductId &&
                string.Equals(item.Color, req.Color, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(item.Provider, req.Provider, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(item.Size, req.Size, StringComparison.OrdinalIgnoreCase));

            if (existingItem != null) {
                existingItem.Quantity += req.Quantity;
                return Results.Ok(new { message = "Item quantity updated successfully", cart = userCart });
            }

            var cartItem = new CartItem {
                CartItemId = Guid.NewGuid().ToString(),
                ProductId = req.ProductId,
                Color = req.Color,
                Provider = req.Provider,
                Size = req.Size,
                Quantity = req.Quantity
            };
            userCart.Add(cartItem);
            return Results.Ok(new { message = "Item added to cart successfully", cart = userCart });
        });
        
        app.MapGet("/get-cart/", ([FromQuery] string email) => {
            if (!DataStore.UsersDb.ContainsKey(email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            var userCart = DataStore.CartDb.GetValueOrDefault(email, new List<CartItem>());
            var detailedCart = userCart.Select(item => {
                var product = DataStore.ProductsDb.FirstOrDefault(p => p.Id == item.ProductId);
                if (product != null) {
                    item.Name = product.Name;
                    item.Price = product.Price;
                    item.Image = product.Image;
                }
                return item;
            }).ToList();
            
            return Results.Ok(new { email = email, cart = detailedCart });
        });
        
        app.MapDelete("/remove-from-cart/", async (HttpRequest request) => {
            var body = await request.ReadFromJsonAsync<RemoveFromCartRequest>();
            if (body == null) return Results.BadRequest();
            if (!DataStore.UsersDb.ContainsKey(body.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            
            var userCart = DataStore.CartDb.GetValueOrDefault(body.Email, new List<CartItem>());
            if (userCart.Count == 0) return Results.Json(new { detail = "Cart is empty" }, statusCode: 404);
            
            var originalCount = userCart.Count;
            userCart.RemoveAll(item => item.CartItemId == body.CartItemId);
            
            if (userCart.Count == originalCount) return Results.Json(new { detail = "Cart item not found" }, statusCode: 404);
            DataStore.CartDb[body.Email] = userCart;
            return Results.Ok(new { message = "Item removed from cart successfully", cart = userCart });
        });

        app.MapPut("/update-cart-item-quantity/", async (HttpRequest request) => {
            var body = await request.ReadFromJsonAsync<UpdateCartItemQuantityRequest>();
            if (body == null || string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.CartItemId)) {
                return Results.BadRequest();
            }
            if (!DataStore.UsersDb.ContainsKey(body.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            if (body.Quantity < 1) return Results.Json(new { detail = "Quantity must be at least 1" }, statusCode: 400);

            var userCart = DataStore.CartDb.GetValueOrDefault(body.Email, new List<CartItem>());
            if (userCart.Count == 0) return Results.Json(new { detail = "Cart is empty" }, statusCode: 404);

            var cartItem = userCart.FirstOrDefault(item => item.CartItemId == body.CartItemId);
            if (cartItem == null) return Results.Json(new { detail = "Cart item not found" }, statusCode: 404);

            cartItem.Quantity = body.Quantity;
            DataStore.CartDb[body.Email] = userCart;
            return Results.Ok(new { message = "Cart item quantity updated successfully", cart = userCart });
        });

        app.MapDelete("/clear-cart/", async (HttpRequest request) => {
            var body = await request.ReadFromJsonAsync<ClearCartRequest>();
            if (body == null || string.IsNullOrWhiteSpace(body.Email)) return Results.BadRequest();
            if (!DataStore.UsersDb.ContainsKey(body.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);

            DataStore.CartDb[body.Email] = new List<CartItem>();
            return Results.Ok(new { message = "Cart cleared successfully", cart = DataStore.CartDb[body.Email] });
        });
    }
}
