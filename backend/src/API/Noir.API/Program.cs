using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Noir.Application.Abstractions;
using Noir.Infrastructure.Authentication;
using Noir.API.Hubs;
using Noir.Infrastructure.Contexts;

var builder = WebApplication.CreateBuilder(args);

// --- 1. SERVÝS KAYITLARI (DEPENDENCY INJECTION) ---

builder.Services.AddControllers();
builder.Services.AddSignalR();

// Tek ve Doðru CORS Politikamýz
builder.Services.AddCors(options =>
{
    options.AddPolicy("NoirCorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // SignalR için zorunlu
    });
});

// Veritabaný Baðlantýsý
builder.Services.AddDbContext<NoirDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// JwtProvider Sözleþmesi 
builder.Services.AddScoped<IJwtProvider, JwtProvider>();

// JWT Doðrulama Ayarlarý
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

// Swagger Ayarlarý
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

// --- 2. UYGULAMA YAÞAM DÖNGÜSÜ (PIPELINE) ---
var app = builder.Build();

// Geliþtirme ortamý ayarlarý
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// 1. ÖNCE CORS ÇALIÞMALI (Sýralama çok önemli!)
app.UseCors("NoirCorsPolicy");

// 2. SONRA GÜVENLÝK KONTROLLERÝ YAPILMALI
app.UseAuthentication();
app.UseAuthorization();

// 3. EN SON ROTALAR (ENDPOINTS VE HUBS) AYAÐA KALKMALI
app.MapControllers();
app.MapHub<OrderHub>("/OrderHub");

app.Run();