using QyrusEcommerceCSharpBackend.Models;
using QyrusEcommerceCSharpBackend.Data;
using Microsoft.AspNetCore.Mvc;

namespace QyrusEcommerceCSharpBackend.Endpoints;

public static class AuthEndpoints {
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app) {
        var group = app.MapGroup("/auth");
        
        group.MapPost("/login/", (LoginRequest req) => {
            if (DataStore.UsersDb.TryGetValue(req.Email, out var user) && user.Password == req.Password) {
                return Results.Ok(new { message = "Login successful" });
            }
            return Results.Json(new { detail = "Invalid email or password" }, statusCode: 401);
        });
        
        group.MapPost("/signup/", (SignupRequest req) => {
            if (DataStore.UsersDb.ContainsKey(req.Email)) {
                return Results.Json(new { detail = "Email already registered" }, statusCode: 400);
            }
            DataStore.UsersDb[req.Email] = new User { Password = req.Password, Verified = false };
            DataStore.AccountDetailsDb[req.Email] = new AccountDetails { Name = "", Age = "", Country = "", Phone = "" };
            
            var token = Guid.NewGuid().ToString();
            DataStore.VerificationTokens[token] = new verification_token_data { Email = req.Email, Otp = "123456" };
            return Results.Ok(new { message = "Signup successful. Please verify your email.", token });
        });
        
        group.MapPost("/verify-email/", (VerifyEmailRequest req) => {
            if (DataStore.VerificationTokens.TryGetValue(req.Token, out var t) && t.Otp == req.Otp) {
                var email = t.Email;
                DataStore.UsersDb[email].Verified = true;
                DataStore.VerificationTokens.Remove(req.Token);
                return Results.Ok(new { message = "Email verified successfully" });
            }
            return Results.Json(new { detail = "Invalid OTP or token" }, statusCode: 400);
        });
        
        group.MapPost("/forgot-password/", (ForgotPasswordRequest req) => {
            if (DataStore.UsersDb.ContainsKey(req.Email)) {
                var token = Guid.NewGuid().ToString();
                DataStore.PasswordResetTokens[token] = new password_reset_token_data { Email = req.Email, Otp = "reset123" };
                return Results.Ok(new { message = "Password reset link sent to your email", token });
            }
            return Results.Json(new { detail = "Email not registered" }, statusCode: 404);
        });
        
        group.MapPost("/reset-password/", (ResetPasswordRequest req) => {
            if (DataStore.PasswordResetTokens.TryGetValue(req.Token, out var t) && t.Otp == req.Otp) {
                var email = t.Email;
                DataStore.UsersDb[email].Password = req.Password;
                DataStore.PasswordResetTokens.Remove(req.Token);
                return Results.Ok(new { message = "Password reset successfully" });
            }
            return Results.Json(new { detail = "Invalid OTP or token" }, statusCode: 400);
        });
    }
}
