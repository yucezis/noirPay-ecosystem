
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Noir.Application.Abstractions;
using Noir.Infrastructure.Authentication;
using Noir.API.Hubs;
using Microsoft.EntityFrameworkCore;
using Noir.Infrastructure.Contexts;
using Microsoft.OpenApi.Models;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();

// --- 1. SERVÝS KAYITLARI (DEPENDENCY INJECTION) ---

builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

// API projelerinde Controller kullanacaðýmýz için bu servisi ekliyoruz
builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173") 
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "NoirPay API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Lütfen kutucuða 'Bearer' yazýp bir boþluk býraktýktan sonra Token'ýnýzý yapýþtýrýn.\n\nÖrnek: Bearer eyJhbG..."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// PostgreSQL baÄŸlantÄ±sÄ±nÄ±n Dependency Injection ile sisteme eklenmesi
builder.Services.AddDbContext<NoirDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi

builder.Services.AddOpenApi();

// Veritabaný Baðlantýsý (NOIR-11)
builder.Services.AddDbContext<NoirDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// JwtProvider Sözleþmesi (NOIR-12)
builder.Services.AddScoped<IJwtProvider, JwtProvider>();

// JWT Doðrulama Ayarlarý (NOIR-12)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Secret"]!))
        };
    });

builder.Services.AddAuthorization();


// --- 2. UYGULAMA YAÞAM DÖNGÜSÜ (PIPELINE) ---
var app = builder.Build();

app.MapHub<OrderHub>("/orderHub");

app.UseCors(policy => policy
    .WithOrigins("http://localhost:5175") 
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();    
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

// Güvenlik kapýlarý (Sýrasý çok kritiktir: Önce kimlik, sonra yetki)
app.UseAuthentication();
app.UseAuthorization();

// Controller rotalarýný ayaða kaldýr
app.MapControllers();

app.Run();