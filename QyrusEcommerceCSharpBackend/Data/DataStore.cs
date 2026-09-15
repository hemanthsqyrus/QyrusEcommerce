using QyrusEcommerceCSharpBackend.Models;
using System.Text.Json;

namespace QyrusEcommerceCSharpBackend.Data;

public static class DataStore {
    public static Dictionary<string, User> UsersDb = new(StringComparer.OrdinalIgnoreCase) 
    {
        { "admin@qyrus.com", new User { Password = "Qyrus@321", Verified = true } }
    };
    public static Dictionary<string, verification_token_data> VerificationTokens = new();
    public static Dictionary<string, password_reset_token_data> PasswordResetTokens = new();
    public static Dictionary<string, AccountDetails> AccountDetailsDb = new(StringComparer.OrdinalIgnoreCase)
    {
        { "admin@qyrus.com", new AccountDetails { Name = "Admin User", Age = 30, Country = "India", Phone = "1234567890" } }
    };
    public static Dictionary<string, List<UserAddress>> AddressesDb = new(StringComparer.OrdinalIgnoreCase);
    public static Dictionary<string, List<CartItem>> CartDb = new(StringComparer.OrdinalIgnoreCase);
    public static Dictionary<string, HashSet<int>> FavoritesDb = new(StringComparer.OrdinalIgnoreCase);
    public static Dictionary<string, List<Order>> OrdersDb = new(StringComparer.OrdinalIgnoreCase);
    
    public static List<Product> ProductsDb = new();
    public static Dictionary<string, List<string>> ProductCategories = new();

    public static void Initialize(string contentRootPath) {
        var filePath = Path.Combine(contentRootPath, "products_data.json");
        if (File.Exists(filePath)) {
            var json = File.ReadAllText(filePath);
            var data = JsonSerializer.Deserialize<ProductsData>(json);
            if (data != null) {
                ProductsDb = data.Products;
                ProductCategories = data.Categories;
            }
        }
    }
}
