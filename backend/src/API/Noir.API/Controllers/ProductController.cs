using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Noir.Domain.Entities;
using Noir.Infrastructure.Contexts;
using System.Security.Claims;
using Noir.Application.DTOs;

namespace Noir.API.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProductController : ControllerBase
    {
        private readonly NoirDbContext _context;

        public ProductController(NoirDbContext context)
        {
            _context = context;
        }

        private async Task<Restaurant?> GetUserRestaurantAsync()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdString, out Guid ownerId))
            {
                return await _context.Restaurants.FirstOrDefaultAsync(r => r.OwnerId == ownerId);
            }
            return null;
        }

        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
        {
            var restaurant = await GetUserRestaurantAsync();
            if (restaurant == null) return Unauthorized(new { message = "Restorant bulunamadı"});

            var categoryExists = await _context.Categories
                .AnyAsync(c => c.Id == request.CategoryId && c.RestaurantId == restaurant.Id);

            if (!categoryExists) return BadRequest(new { message = "Geçersiz kategori. Bu kategori size ait değil veya bulunamadı." });

            var product = new Product
            {
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                ImageUrl = request.ImageUrl,
                CategoryId = request.CategoryId
            };

            await _context.AddAsync(product);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { message = "Kategori başarıyla oluşturuldu" });
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts()
        {
            var restaurant = await GetUserRestaurantAsync();
            if (restaurant == null) return Ok(new List<object>());

            var product = await _context.Products
                .Include(p => p.CategoryId)
                .Where(p => p.Category!.RestaurantId == restaurant.Id)
                .Select(p => new
                {
                    p.Name,
                    p.Description,
                    p.Price,
                    p.ImageUrl,
                    p.IsActive,
                    CategoryId = p.Category!.Id,
                    CategoryName = p.Category.Name
                }).ToListAsync();

            return Ok(product);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductRequest request)
        {
            var restaurant = await GetUserRestaurantAsync();
            if(restaurant == null) return Unauthorized();

            var product = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id && p.Category!.RestaurantId == restaurant.Id);

            if (product == null) return NotFound(new { message = "Ürün bulunamadı." });

            if (product.CategoryId != request.CategoryId)
            {
                var newCategoryExists = await _context.Categories
                    .AnyAsync(c => c.Id == request.CategoryId && c.RestaurantId == restaurant.Id);

                if (!newCategoryExists)
                    return BadRequest(new { message = "Hedef kategori size ait değil." });

                product.CategoryId = request.CategoryId;
            }

            product.Name = request.Name;
            product.Description = request.Description;
            product.Price = request.Price;
            product.ImageUrl = request.ImageUrl;
            product.IsActive = request.IsActive;
            product.UpdatedTime = DateTime.UtcNow;

            _context.Products.Update(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Ürün güncellendi." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(Guid id)
        {
            var restaurant = await GetUserRestaurantAsync();
            if (restaurant == null) return Unauthorized();

            var product = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id && p.Category!.RestaurantId == restaurant.Id);

            if (product == null) return NotFound(new { message = "Ürün bulunamadı"});

            _context.Products.Remove(product);
            _context.SaveChangesAsync();

            return Ok(new { message = "Başarıyla Silindi" });

        }
    }
}
