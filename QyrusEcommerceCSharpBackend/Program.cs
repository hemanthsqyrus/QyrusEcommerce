using QyrusEcommerceCSharpBackend.Data;
using QyrusEcommerceCSharpBackend.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();

// Configure CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");

// Initialize Data Store
DataStore.Initialize(app.Environment.ContentRootPath);

// Register Endpoints
app.MapAuthEndpoints();
app.MapProductEndpoints();
app.MapAccountEndpoints();
app.MapCartEndpoints();
app.MapFavoritesEndpoints();
app.MapAddressEndpoints();
app.MapOrderEndpoints();

// Configure port to match python backend (9892)
app.Run("http://localhost:9892");
