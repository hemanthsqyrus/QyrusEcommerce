using QyrusEcommerceCSharpBackend.Models;
using QyrusEcommerceCSharpBackend.Data;
using Microsoft.AspNetCore.Mvc;

namespace QyrusEcommerceCSharpBackend.Endpoints;

public static class FavoritesEndpoints {
    public static void MapFavoritesEndpoints(this IEndpointRouteBuilder app) {
        app.MapPost("/add-favorite/", (AddFavoriteInput req) => {
            if (!DataStore.UsersDb.ContainsKey(req.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            var product = DataStore.ProductsDb.FirstOrDefault(p => p.Id == req.ProductId);
            if (product == null) return Results.Json(new { detail = "Product not found" }, statusCode: 404);
            
            if (!DataStore.FavoritesDb.ContainsKey(req.Email)) DataStore.FavoritesDb[req.Email] = new HashSet<int>();
            DataStore.FavoritesDb[req.Email].Add(req.ProductId);
            
            return Results.Ok(new { message = "Product added to favorites successfully", favorites = DataStore.FavoritesDb[req.Email].ToList() });
        });
        
        app.MapGet("/get-favorites/", ([FromQuery] string email) => {
            if (!DataStore.UsersDb.ContainsKey(email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            var userFavorites = DataStore.FavoritesDb.GetValueOrDefault(email, new HashSet<int>()).ToList();
            return Results.Ok(new { email = email, favorites = userFavorites });
        });
        
        app.MapDelete("/remove-favorite/", async (HttpRequest request) => {
            var body = await request.ReadFromJsonAsync<AddFavoriteInput>();
            if (body == null) return Results.BadRequest();
            if (!DataStore.UsersDb.ContainsKey(body.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            if (!DataStore.FavoritesDb.ContainsKey(body.Email)) return Results.Json(new { detail = "No favorites found for this user" }, statusCode: 404);
            if (!DataStore.FavoritesDb[body.Email].Contains(body.ProductId)) return Results.Json(new { detail = "Product not found in favorites" }, statusCode: 404);
            
            DataStore.FavoritesDb[body.Email].Remove(body.ProductId);
            return Results.Ok(new { message = "Product removed from favorites successfully", favorites = DataStore.FavoritesDb[body.Email].ToList() });
        });
    }
}
