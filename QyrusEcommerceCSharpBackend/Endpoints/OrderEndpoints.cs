using QyrusEcommerceCSharpBackend.Models;
using QyrusEcommerceCSharpBackend.Data;
using Microsoft.AspNetCore.Mvc;

namespace QyrusEcommerceCSharpBackend.Endpoints;

public static class OrderEndpoints {
    public static void MapOrderEndpoints(this IEndpointRouteBuilder app) {
        app.MapPost("/create-order/", (CreateOrderRequest req) => {
            if (!DataStore.UsersDb.ContainsKey(req.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            var userAddresses = DataStore.AddressesDb.GetValueOrDefault(req.Email, new List<UserAddress>());
            if (!userAddresses.Any(a => a.AddressId == req.AddressId)) return Results.Json(new { detail = "Address not found" }, statusCode: 404);
            
            foreach (var product in req.Products) {
                if (!DataStore.ProductsDb.Any(p => p.Id == product.ProductId)) {
                    return Results.Json(new { detail = $"Product with ID {product.ProductId} not found" }, statusCode: 404);
                }
            }
            
            var orderId = Guid.NewGuid().ToString();
            if (!DataStore.OrdersDb.ContainsKey(req.Email)) DataStore.OrdersDb[req.Email] = new List<Order>();
            
            DataStore.OrdersDb[req.Email].Add(new Order {
                OrderId = orderId,
                AddressId = req.AddressId,
                Products = req.Products,
                PaymentMethod = req.PaymentMethod,
                Status = "confirmed",
                CreatedAt = DateTime.UtcNow.ToString("o")
            });
            
            return Results.Ok(new { message = "Order created successfully", order_id = orderId, order_status = "confirmed" });
        });
        
        app.MapGet("/get-orders/", ([FromQuery] string email) => {
            if (!DataStore.UsersDb.ContainsKey(email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            var userOrders = DataStore.OrdersDb.GetValueOrDefault(email, new List<Order>());
            return Results.Ok(new { email = email, orders = userOrders });
        });
        
        app.MapPost("/cancel-order/", (CancelOrderRequest req) => {
            if (!DataStore.UsersDb.ContainsKey(req.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            var userOrders = DataStore.OrdersDb.GetValueOrDefault(req.Email, new List<Order>());
            var order = userOrders.FirstOrDefault(o => o.OrderId == req.OrderId);
            if (order != null) {
                if (order.Status == "cancelled") return Results.Json(new { detail = "Order already cancelled" }, statusCode: 400);
                order.Status = "cancelled";
                return Results.Ok(new { message = "Order cancelled successfully", order_id = req.OrderId, order_status = "cancelled" });
            }
            return Results.Json(new { detail = "Order not found" }, statusCode: 404);
        });
    }
}
