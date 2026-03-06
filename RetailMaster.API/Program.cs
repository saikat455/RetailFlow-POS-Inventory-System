using System.Text;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using POSSystem.Data;
using POSSystem.Services;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddHttpContextAccessor();

// ── All services ──────────────────────────────────────────────
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<GoogleAuthService>();        // ← NEW
builder.Services.AddScoped<ICurrentCompanyService, CurrentCompanyService>();
builder.Services.AddScoped<BranchService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<SaleService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<SalesReportService>();
builder.Services.AddScoped<SettingsService>();

var jwtKey      = builder.Configuration["Jwt:Key"]      ?? throw new InvalidOperationException("Jwt:Key missing.");
var jwtIssuer   = builder.Configuration["Jwt:Issuer"]   ?? "POSProAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "POSProClient";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtIssuer,
            ValidAudience            = jwtAudience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"]
    ?? "http://localhost:5173,http://localhost:5174")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
    options.AddPolicy("AllowReact", p =>
        p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }

app.UseCors("AllowReact");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();