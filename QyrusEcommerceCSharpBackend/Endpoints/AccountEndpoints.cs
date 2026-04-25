using QyrusEcommerceCSharpBackend.Models;
using QyrusEcommerceCSharpBackend.Data;
using Microsoft.AspNetCore.Mvc;

namespace QyrusEcommerceCSharpBackend.Endpoints;

public static class AccountEndpoints {
    public static void MapAccountEndpoints(this IEndpointRouteBuilder app) {
        app.MapGet("/get-account-details/", ([FromQuery] string email) => {
            if (DataStore.AccountDetailsDb.TryGetValue(email, out var details)) {
                return Results.Ok(new { email = email, name = details.Name, age = details.Age, country = details.Country, phone = details.Phone });
            }
            return Results.Json(new { detail = "Account details not found" }, statusCode: 404);
        });
        
        app.MapPost("/update-account-details/", (UpdateAccountDetailsRequest req) => {
            if (DataStore.AccountDetailsDb.ContainsKey(req.Email)) {
                DataStore.AccountDetailsDb[req.Email] = new AccountDetails {
                    Name = req.Name, Phone = req.Phone, Age = req.Age, Country = req.Country
                };
                return Results.Ok(new { message = "Account details updated successfully", updated_details = DataStore.AccountDetailsDb[req.Email] });
            }
            return Results.Json(new { detail = "Account not found" }, statusCode: 404);
        });
        
        app.MapPost("/record-contact/", (RecordContactRequest req) => {
            Console.WriteLine($"Contact recorded from {req.Email}: {req.Comments}");
            return Results.Ok(new { message = "Contact recorded successfully", email = req.Email });
        });
    }
}
