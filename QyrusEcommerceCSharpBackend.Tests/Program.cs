using System.Net.Http.Json;
using System.Text.Json.Nodes;

// Run against a local C# service. Each run creates isolated test users.
using var client = new HttpClient { BaseAddress = new Uri("http://localhost:9892") };
var email = $"saved-cart-{Guid.NewGuid():N}@example.com";
var otherEmail = $"saved-cart-{Guid.NewGuid():N}@example.com";
var assertions = 0;
void Check(bool condition, string message) {
    if (!condition) throw new Exception(message);
    assertions++;
}
async Task<JsonNode> Send(string method, string path, object? body = null, int status = 200) {
    using var request = new HttpRequestMessage(new HttpMethod(method), path);
    if (body != null) request.Content = JsonContent.Create(body);
    using var response = await client.SendAsync(request);
    Check((int)response.StatusCode == status, $"{method} {path}: expected {status}, got {(int)response.StatusCode}");
    return JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
}
await Send("POST", "/auth/signup/", new { email, password = "cart-test-only" });
await Send("POST", "/auth/signup/", new { email = otherEmail, password = "cart-test-only" });
var products = await Send("GET", "/search-products/?query=");
var productId = products["products"]![0]!["id"]!.GetValue<int>();
async Task<string> Add(int quantity = 2, string color = "Red", string size = "M") {
    var result = await Send("POST", "/add-to-cart/", new { email, product_id = productId, quantity, color, size, provider = "Test" });
    return result["cart"]!.AsArray().Last()!["cart_item_id"]!.GetValue<string>();
}
object Item(string id) => new { email, cart_item_id = id };
Check((await Send("GET", $"/get-saved-cart/?email={email}"))["saved_cart"]!.AsArray().Count == 0, "Initially empty");
var id = await Add();
var saved = await Send("POST", "/save-cart-item/", Item(id));
Check(saved["cart"]!.AsArray().Count == 0, "Save removes active item");
Check(saved["saved_cart"]![0]!["quantity"]!.GetValue<int>() == 2, "Save preserves quantity");
Check(saved["saved_cart"]![0]!["color"]!.GetValue<string>() == "Red", "Save preserves options");
Check(saved["saved_cart"]![0]!["name"] != null && saved["saved_cart"]![0]!["price"] != null, "Response has product details");
Check((await Send("GET", $"/get-saved-cart/?email={email}"))["saved_cart"]!.AsArray().Count == 1, "Saved state survives refetch");
await Send("POST", "/save-cart-item/", Item(id), 404);
await Send("POST", "/restore-cart-item/", new { email = otherEmail, cart_item_id = id }, 404);
await Send("DELETE", "/remove-saved-cart-item/", new { email = otherEmail, cart_item_id = id }, 404);
var activeId = await Add(3, "red");
var restored = await Send("POST", "/restore-cart-item/", Item(id));
Check(restored["saved_cart"]!.AsArray().Count == 0, "Restore removes saved item");
Check(restored["cart"]!.AsArray().Count == 1 && restored["cart"]![0]!["quantity"]!.GetValue<int>() == 5, "Restore merges matching variant ignoring case");
await Send("POST", "/restore-cart-item/", Item(id), 404);
await Send("POST", "/save-cart-item/", Item(activeId));
await Add(1, "Blue");
restored = await Send("POST", "/restore-cart-item/", Item(activeId));
Check(restored["cart"]!.AsArray().Count == 2, "Different variants remain separate");
var concurrentId = await Add(4, "Green");
var responses = await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => client.PostAsJsonAsync("/save-cart-item/", Item(concurrentId))));
Check(responses.Count(r => r.IsSuccessStatusCode) == 1, "Concurrent save moves exactly once");
Check(responses.All(r => (int)r.StatusCode is 200 or 404), "Concurrent save has no server errors");
foreach (var response in responses) response.Dispose();
saved = await Send("GET", $"/get-saved-cart/?email={email}");
Check(saved["saved_cart"]!.AsArray().Count == 1 && saved["saved_cart"]![0]!["quantity"]!.GetValue<int>() == 4, "Concurrent requests preserve quantity");
await Send("DELETE", "/remove-saved-cart-item/", Item(concurrentId));
await Send("DELETE", "/remove-saved-cart-item/", Item(concurrentId), 404);
await Send("POST", "/save-cart-item/", new { email }, 400);
await Send("POST", "/restore-cart-item/", Item("missing"), 404);
await Send("POST", "/save-cart-item/", new { email = "unknown@example.com", cart_item_id = id }, 404);
await Send("POST", "/add-to-cart/", new { email, product_id = productId, quantity = 0 }, 400);
await Send("POST", "/add-to-cart/", new { email, product_id = -1, quantity = 1 }, 404);
var overflowId = await Add(int.MaxValue, "Overflow");
await Send("POST", "/save-cart-item/", Item(overflowId));
await Add(1, "Overflow");
await Send("POST", "/restore-cart-item/", Item(overflowId), 400);
Check((await Send("GET", $"/get-saved-cart/?email={email}"))["saved_cart"]![0]!["quantity"]!.GetValue<int>() == int.MaxValue, "Rejected restore leaves source intact");
Console.WriteLine($"Passed {assertions} assertions for save, restore, merging, isolation, validation, and concurrency.");
