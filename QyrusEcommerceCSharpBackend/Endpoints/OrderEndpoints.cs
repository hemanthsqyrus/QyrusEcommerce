using QyrusEcommerceCSharpBackend.Models;
using QyrusEcommerceCSharpBackend.Data;
using Microsoft.AspNetCore.Mvc;

namespace QyrusEcommerceCSharpBackend.Endpoints;

public static class OrderEndpoints {
    private const decimal TaxRate = 0.18m;
    private const decimal FreeShippingSubtotal = 500m;
    private const decimal FlatShippingFee = 40m;

    public static void MapOrderEndpoints(this IEndpointRouteBuilder app) {
        app.MapPost("/create-order/", (CreateOrderRequest req, HttpRequest httpRequest) => {
            if (!DataStore.UsersDb.ContainsKey(req.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            var userAddresses = DataStore.AddressesDb.GetValueOrDefault(req.Email, new List<UserAddress>());
            if (!userAddresses.Any(a => a.AddressId == req.AddressId)) return Results.Json(new { detail = "Address not found" }, statusCode: 404);

            if (req.Products == null || req.Products.Count == 0) {
                return Results.Json(new { detail = "At least one product is required" }, statusCode: 400);
            }

            if (!DataStore.OrdersDb.TryGetValue(req.Email, out var userOrders)) {
                userOrders = new List<Order>();
                DataStore.OrdersDb[req.Email] = userOrders;
            }

            var idempotencyKey = string.IsNullOrWhiteSpace(req.IdempotencyKey) ? null : req.IdempotencyKey.Trim();
            if (idempotencyKey == null) {
                var headerKey = httpRequest.Headers["Idempotency-Key"].ToString();
                if (!string.IsNullOrWhiteSpace(headerKey)) {
                    idempotencyKey = headerKey.Trim();
                }
            }
            if (idempotencyKey != null) {
                var existingOrder = userOrders.FirstOrDefault(order => order.IdempotencyKey == idempotencyKey);
                if (existingOrder != null) {
                    return Results.Ok(BuildCreateOrderResponse(existingOrder));
                }
            }

            var snapshotProducts = new List<OrderProductSnapshot>();
            foreach (var item in req.Products) {
                var productId = item.ProductId ?? item.ProductIdSnake;
                if (productId == null) {
                    return Results.Json(new { detail = "Each product must include productId" }, statusCode: 400);
                }
                if (item.Quantity <= 0) {
                    return Results.Json(new { detail = $"Quantity must be greater than zero for product {productId}" }, statusCode: 400);
                }

                var product = DataStore.ProductsDb.FirstOrDefault(p => p.Id == productId.Value);
                if (product == null) {
                    return Results.Json(new { detail = $"Product with ID {productId.Value} not found" }, statusCode: 404);
                }

                var unitPrice = RoundMoney(product.Price);
                var lineTotal = RoundMoney(unitPrice * item.Quantity);
                snapshotProducts.Add(new OrderProductSnapshot {
                    ProductId = product.Id,
                    Name = product.Name,
                    Image = product.Image,
                    Quantity = item.Quantity,
                    SelectedColor = FirstNonEmpty(item.SelectedColor, item.Color),
                    SelectedProvider = FirstNonEmpty(item.SelectedProvider, item.Provider),
                    SelectedSize = FirstNonEmpty(item.SelectedSize, item.Size),
                    Price = unitPrice,
                    LineTotal = lineTotal
                });
            }

            var subtotal = RoundMoney(snapshotProducts.Sum(item => item.LineTotal));
            var tax = RoundMoney(subtotal * TaxRate);
            var shipping = RoundMoney(subtotal >= FreeShippingSubtotal ? 0m : FlatShippingFee);
            var total = RoundMoney(subtotal + tax + shipping);
            
            var orderId = Guid.NewGuid().ToString();
            var newOrder = new Order {
                OrderId = orderId,
                AddressId = req.AddressId,
                Products = snapshotProducts,
                PaymentMethod = req.PaymentMethod,
                IdempotencyKey = idempotencyKey,
                Subtotal = subtotal,
                Tax = tax,
                Shipping = shipping,
                Total = total,
                Status = "confirmed",
                CreatedAt = DateTime.UtcNow.ToString("o")
            };

            userOrders.Add(newOrder);
            return Results.Ok(BuildCreateOrderResponse(newOrder));
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

    private static decimal RoundMoney(decimal value) {
        return Math.Round(value, 2, MidpointRounding.AwayFromZero);
    }

    private static string FirstNonEmpty(params string?[] values) {
        return values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v)) ?? "";
    }

    private static object BuildCreateOrderResponse(Order order) {
        return new {
            message = "Order created successfully",
            order_id = order.OrderId,
            order_status = order.Status,
            subtotal = order.Subtotal,
            tax = order.Tax,
            shipping = order.Shipping,
            total = order.Total
        };
    }
}
