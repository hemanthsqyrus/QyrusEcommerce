using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace QyrusEcommerceCSharpBackend.Models;

public class CreateOrderRequest {
    [EmailAddress] public string Email { get; set; } = "";
    public string AddressId { get; set; } = "";
    public List<OrderProductInput> Products { get; set; } = new();
    public string PaymentMethod { get; set; } = "";
    public string? IdempotencyKey { get; set; }
}

public class OrderProductInput {
    [JsonPropertyName("productId")] public int? ProductId { get; set; }
    [JsonPropertyName("product_id")] public int? ProductIdSnake { get; set; }
    public int Quantity { get; set; } = 1;
    [JsonPropertyName("selectedColor")] public string? SelectedColor { get; set; }
    public string? Color { get; set; }
    [JsonPropertyName("selectedProvider")] public string? SelectedProvider { get; set; }
    public string? Provider { get; set; }
    [JsonPropertyName("selectedSize")] public string? SelectedSize { get; set; }
    public string? Size { get; set; }
}

public class CancelOrderRequest {
    [EmailAddress] public string Email { get; set; } = "";
    public string OrderId { get; set; } = "";
}

public class AddFavoriteInput {
    [EmailAddress] public string Email { get; set; } = "";
    [JsonPropertyName("product_id")] public int ProductId { get; set; }
}

public class AddToCartRequest {
    [EmailAddress] public string Email { get; set; } = "";
    [JsonPropertyName("product_id")] public int ProductId { get; set; }
    public string Color { get; set; } = "";
    public string Provider { get; set; } = "";
    public string Size { get; set; } = "";
    public int Quantity { get; set; }
}

public class RemoveFromCartRequest {
    public string Email { get; set; } = "";
    [JsonPropertyName("cart_item_id")] public string CartItemId { get; set; } = "";
}

public class CreateAddressRequest {
    [EmailAddress] public string Email { get; set; } = "";
    public string Address { get; set; } = "";
}

public class DeleteAddressRequest {
    [EmailAddress] public string Email { get; set; } = "";
    public string AddressId { get; set; } = "";
}

public class UpdateAddressRequest {
    [EmailAddress] public string Email { get; set; } = "";
    public string AddressId { get; set; } = "";
    public string NewAddress { get; set; } = "";
}

public class LoginRequest {
    [EmailAddress] public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class RecordContactRequest {
    [EmailAddress] public string Email { get; set; } = "";
    public string Comments { get; set; } = "";
}

public class SignupRequest {
    [EmailAddress] public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class VerifyEmailRequest {
    public string Otp { get; set; } = "";
    public string Token { get; set; } = "";
}

public class ForgotPasswordRequest {
    [EmailAddress] public string Email { get; set; } = "";
}

public class ResetPasswordRequest {
    public string Password { get; set; } = "";
    public string Otp { get; set; } = "";
    public string Token { get; set; } = "";
}

public class UpdateAccountDetailsRequest {
    [EmailAddress] public string Email { get; set; } = "";
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    public object Age { get; set; } = "";
    public string Country { get; set; } = "";
}

// Entities
public class User {
    [JsonPropertyName("password")] public string Password { get; set; } = "";
    [JsonPropertyName("verified")] public bool Verified { get; set; }
}

public class AccountDetails {
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("age")] public object Age { get; set; } = "";
    [JsonPropertyName("country")] public string Country { get; set; } = "";
    [JsonPropertyName("phone")] public string Phone { get; set; } = "";
}

public class Product {
    [JsonPropertyName("id")] public int Id { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("price")] public decimal Price { get; set; }
    [JsonPropertyName("image")] public string Image { get; set; } = "";
    [JsonPropertyName("category")] public string Category { get; set; } = "";
    [JsonPropertyName("subcategory")] public string Subcategory { get; set; } = "";
    [JsonPropertyName("sizes")] public List<string>? Sizes { get; set; }
    [JsonPropertyName("colors")] public List<object>? Colors { get; set; }
    [JsonPropertyName("providers")] public List<string>? Providers { get; set; }
    [JsonPropertyName("description")] public string? Description { get; set; }
    [JsonPropertyName("rating")] public int? Rating { get; set; }
    [JsonPropertyName("comments")] public List<string>? Comments { get; set; }
}

public class ProductsData {
    [JsonPropertyName("categories")] public Dictionary<string, List<string>> Categories { get; set; } = new();
    [JsonPropertyName("products")] public List<Product> Products { get; set; } = new();
}

public class CartItem {
    [JsonPropertyName("cart_item_id")] public string CartItemId { get; set; } = "";
    [JsonPropertyName("product_id")] public int ProductId { get; set; }
    [JsonPropertyName("color")] public string Color { get; set; } = "";
    [JsonPropertyName("provider")] public string Provider { get; set; } = "";
    [JsonPropertyName("size")] public string Size { get; set; } = "";
    [JsonPropertyName("quantity")] public int Quantity { get; set; }
    [JsonPropertyName("name")] public string? Name { get; set; }
    [JsonPropertyName("price")] public decimal? Price { get; set; }
    [JsonPropertyName("image")] public string? Image { get; set; }
}

public class UserAddress {
    [JsonPropertyName("address_id")] public string AddressId { get; set; } = "";
    [JsonPropertyName("address")] public string Address { get; set; } = "";
}

public class Order {
    [JsonPropertyName("order_id")] public string OrderId { get; set; } = "";
    [JsonPropertyName("address_id")] public string AddressId { get; set; } = "";
    [JsonPropertyName("products")] public List<OrderProductSnapshot> Products { get; set; } = new();
    [JsonPropertyName("payment_method")] public string PaymentMethod { get; set; } = "";
    [JsonPropertyName("idempotency_key")] public string? IdempotencyKey { get; set; }
    [JsonPropertyName("subtotal")] public decimal Subtotal { get; set; }
    [JsonPropertyName("tax")] public decimal Tax { get; set; }
    [JsonPropertyName("shipping")] public decimal Shipping { get; set; }
    [JsonPropertyName("total")] public decimal Total { get; set; }
    [JsonPropertyName("status")] public string Status { get; set; } = "";
    [JsonPropertyName("created_at")] public string CreatedAt { get; set; } = "";
}

public class OrderProductSnapshot {
    [JsonPropertyName("productId")] public int ProductId { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("image")] public string Image { get; set; } = "";
    [JsonPropertyName("quantity")] public int Quantity { get; set; }
    [JsonPropertyName("selectedColor")] public string SelectedColor { get; set; } = "";
    [JsonPropertyName("selectedProvider")] public string SelectedProvider { get; set; } = "";
    [JsonPropertyName("selectedSize")] public string SelectedSize { get; set; } = "";
    [JsonPropertyName("price")] public decimal Price { get; set; }
    [JsonPropertyName("line_total")] public decimal LineTotal { get; set; }
}

public class verification_token_data {
    public string Email { get; set; } = "";
    public string Otp { get; set; } = "";
}

public class password_reset_token_data {
    public string Email { get; set; } = "";
    public string Otp { get; set; } = "";
}
