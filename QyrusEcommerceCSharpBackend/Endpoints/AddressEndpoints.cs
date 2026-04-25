using QyrusEcommerceCSharpBackend.Models;
using QyrusEcommerceCSharpBackend.Data;
using Microsoft.AspNetCore.Mvc;

namespace QyrusEcommerceCSharpBackend.Endpoints;

public static class AddressEndpoints {
    public static void MapAddressEndpoints(this IEndpointRouteBuilder app) {
        app.MapPost("/create-address/", (CreateAddressRequest req) => {
            if (!DataStore.UsersDb.ContainsKey(req.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            
            var addressId = Guid.NewGuid().ToString();
            if (!DataStore.AddressesDb.ContainsKey(req.Email)) DataStore.AddressesDb[req.Email] = new List<UserAddress>();
            
            DataStore.AddressesDb[req.Email].Add(new UserAddress { AddressId = addressId, Address = req.Address });
            
            return Results.Ok(new { message = "Address added successfully", address_id = addressId, addresses = DataStore.AddressesDb[req.Email] });
        });
        
        app.MapGet("/get-addresses/", ([FromQuery] string email) => {
            if (!DataStore.UsersDb.ContainsKey(email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            var userAddresses = DataStore.AddressesDb.GetValueOrDefault(email, new List<UserAddress>());
            return Results.Ok(new { email = email, addresses = userAddresses });
        });
        
        app.MapDelete("/delete-address/", async (HttpRequest request) => {
            var body = await request.ReadFromJsonAsync<DeleteAddressRequest>();
            if (body == null) return Results.BadRequest();
            if (!DataStore.UsersDb.ContainsKey(body.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            
            var userAddresses = DataStore.AddressesDb.GetValueOrDefault(body.Email, new List<UserAddress>());
            var originalCount = userAddresses.Count;
            userAddresses.RemoveAll(a => a.AddressId == body.AddressId);
            
            if (userAddresses.Count == originalCount) return Results.Json(new { detail = "Address not found" }, statusCode: 404);
            DataStore.AddressesDb[body.Email] = userAddresses;
            return Results.Ok(new { message = "Address deleted successfully", addresses = userAddresses });
        });
        
        app.MapPut("/update-address/", (UpdateAddressRequest req) => {
            if (!DataStore.UsersDb.ContainsKey(req.Email)) return Results.Json(new { detail = "User not found" }, statusCode: 404);
            var userAddresses = DataStore.AddressesDb.GetValueOrDefault(req.Email, new List<UserAddress>());
            var addr = userAddresses.FirstOrDefault(a => a.AddressId == req.AddressId);
            if (addr != null) {
                addr.Address = req.NewAddress;
                return Results.Ok(new { message = "Address updated successfully", addresses = userAddresses });
            }
            return Results.Json(new { detail = "Address not found" }, statusCode: 404);
        });
    }
}
