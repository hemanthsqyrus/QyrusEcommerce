using QyrusEcommerceCSharpBackend.Models;
using QyrusEcommerceCSharpBackend.Data;
using Microsoft.AspNetCore.Mvc;

namespace QyrusEcommerceCSharpBackend.Endpoints;

public static class CartEndpoints {
    public static void MapCartEndpoints(this IEndpointRouteBuilder app) {
        app.MapPost("/add-to-cart/", (AddToCartRequest req) => {
            lock (DataStore.CartLock) {
                if (!DataStore.UsersDb.ContainsKey(req.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
                if (req.Quantity < 1) return Results.Json(new { detail = "Quantity must be at least 1" }, statusCode: 400);
                var product = DataStore.ProductsDb.FirstOrDefault(p => p.Id == req.ProductId);
                if (product == null) return Results.Json(new { detail = "Product not found" }, statusCode: 404);

                if (!DataStore.CartDb.ContainsKey(req.Email)) DataStore.CartDb[req.Email] = new List<CartItem>();

                var cartItem = new CartItem {
                    CartItemId = Guid.NewGuid().ToString(),
                    ProductId = req.ProductId,
                    Color = req.Color,
                    Provider = req.Provider,
                    Size = req.Size,
                    Quantity = req.Quantity
                };
                DataStore.CartDb[req.Email].Add(cartItem);
                return Results.Ok(new { message = "Item added to cart successfully", cart = Snapshot(DataStore.CartDb[req.Email]) });
            }
        });
        
        app.MapGet("/get-cart/", ([FromQuery] string email) => {
            lock (DataStore.CartLock) {
                if (!DataStore.UsersDb.ContainsKey(email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
                var userCart = DataStore.CartDb.GetValueOrDefault(email, new List<CartItem>());
                return Results.Ok(new { email = email, cart = Snapshot(userCart) });
            }
        });
        
        app.MapDelete("/remove-from-cart/", async (HttpRequest request) => {
            var body = await request.ReadFromJsonAsync<RemoveFromCartRequest>();
            if (body == null) return Results.BadRequest();
            lock (DataStore.CartLock) {
                if (!DataStore.UsersDb.ContainsKey(body.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);

                var userCart = DataStore.CartDb.GetValueOrDefault(body.Email, new List<CartItem>());
                if (userCart.Count == 0) return Results.Json(new { detail = "Cart is empty" }, statusCode: 404);

                var originalCount = userCart.Count;
                userCart.RemoveAll(item => item.CartItemId == body.CartItemId);

                if (userCart.Count == originalCount) return Results.Json(new { detail = "Cart item not found" }, statusCode: 404);
                DataStore.CartDb[body.Email] = userCart;
                return Results.Ok(new { message = "Item removed from cart successfully", cart = Snapshot(userCart) });
            }
        });
        app.MapGet("/get-saved-cart/", ([FromQuery] string email) => {
            lock (DataStore.CartLock) {
                if (!DataStore.UsersDb.ContainsKey(email)) return Error("User not found", 404);
                return Results.Ok(new { email, saved_cart = Snapshot(DataStore.SavedCartDb.GetValueOrDefault(email, new())) });
            }
        });
        app.MapPost("/save-cart-item/", (SavedCartItemRequest req) => Move(req, save: true));
        app.MapPost("/restore-cart-item/", (SavedCartItemRequest req) => Move(req, save: false));
        app.MapDelete("/remove-saved-cart-item/", async (HttpRequest request) => {
            var req = await request.ReadFromJsonAsync<SavedCartItemRequest>();
            if (req == null || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.CartItemId))
                return Error("Email and cart_item_id are required", 400);
            lock (DataStore.CartLock) {
                if (!DataStore.UsersDb.ContainsKey(req.Email)) return Error("User not found", 404);
                var saved = DataStore.SavedCartDb.GetValueOrDefault(req.Email, new());
                if (saved.RemoveAll(item => item.CartItemId == req.CartItemId) == 0)
                    return Error("Saved cart item not found", 404);
                return State(req.Email);
            }
        });
    }
    private static IResult Error(string detail, int status) => Results.Json(new { detail }, statusCode: status);

    private static IResult Move(SavedCartItemRequest req, bool save) {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.CartItemId))
            return Error("Email and cart_item_id are required", 400);
        lock (DataStore.CartLock) {
            if (!DataStore.UsersDb.ContainsKey(req.Email)) return Error("User not found", 404);
            var sourceDb = save ? DataStore.CartDb : DataStore.SavedCartDb;
            var targetDb = save ? DataStore.SavedCartDb : DataStore.CartDb;
            var source = sourceDb.GetValueOrDefault(req.Email, new());
            var item = source.FirstOrDefault(i => i.CartItemId == req.CartItemId);
            if (item == null) return Error("Cart item not found", 404);
            if (!DataStore.ProductsDb.Any(p => p.Id == item.ProductId)) return Error("Product not found", 404);
            if (item.Quantity < 1) return Error("Quantity must be at least 1", 400);
            var target = targetDb.GetValueOrDefault(req.Email, new());
            var existing = target.FirstOrDefault(i => i.ProductId == item.ProductId
                && string.Equals(i.Color, item.Color, StringComparison.OrdinalIgnoreCase)
                && string.Equals(i.Size, item.Size, StringComparison.OrdinalIgnoreCase)
                && string.Equals(i.Provider, item.Provider, StringComparison.OrdinalIgnoreCase));
            if (existing != null) {
                if ((long)existing.Quantity + item.Quantity > int.MaxValue) return Error("Quantity is too large", 400);
                existing.Quantity += item.Quantity;
            } else {
                target.Add(item);
            }
            targetDb[req.Email] = target;
            source.Remove(item);
            return State(req.Email);
        }
    }

    // Materialize copies under the lock so response serialization cannot race with cart mutations.
    private static List<CartItem> Snapshot(List<CartItem> items) => items.Select(item => {
        var product = DataStore.ProductsDb.FirstOrDefault(p => p.Id == item.ProductId);
        return new CartItem {
            CartItemId = item.CartItemId, ProductId = item.ProductId, Quantity = item.Quantity,
            Color = item.Color, Size = item.Size, Provider = item.Provider,
            Name = product?.Name ?? item.Name, Price = product?.Price ?? item.Price, Image = product?.Image ?? item.Image
        };
    }).ToList();

    private static IResult State(string email) => Results.Ok(new {
        cart = Snapshot(DataStore.CartDb.GetValueOrDefault(email, new())),
        saved_cart = Snapshot(DataStore.SavedCartDb.GetValueOrDefault(email, new()))
    });
}
