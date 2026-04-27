using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Noir.Application.DTOs;
using System.Security.Claims;
using Noir.Domain.Entities;
using Noir.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Noir.API.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CategoryController : ControllerBase
    {
        private readonly NoirDbContext _context;

        public CategoryController(NoirDbContext context)
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
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
        {
            var restaurant = await GetUserRestaurantAsync();
            if (restaurant == null)
            {
                return BadRequest(new { message = "kategori oluşturmak için önce restorant ekleyiniz" });
            }

            var cat = new Category
            {
                Name = request.Name,
                RestaurantId = restaurant.Id
            };

            await _context.AddAsync(cat);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { message = "Kategori başarıyla oluşturuldu" });
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var restaurant = await GetUserRestaurantAsync();
            if (restaurant == null) return Ok(new List<object>());

            var cat = await _context.Categories
                .Where(c => c.RestaurantId == restaurant.Id ).Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.IsActive,
                    c.CreatedTime,

                }).ToListAsync();
            return Ok(cat);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryRequest request)
        {
            var restaurant = await GetUserRestaurantAsync();
            if(restaurant == null) return Unauthorized();

            var cat = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.RestaurantId == restaurant.Id);

            if (cat == null) return NotFound(new {message = "kategori bulunamadı"});

            cat.Name = request.Name;
            cat.IsActive = request.IsActive;
            cat.UpdatedTime = DateTime.UtcNow;

            _context.Categories.Update(cat);
            _context.SaveChangesAsync();

            return Ok(new { message = "Kategori güncellendi." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(Guid id)
        {
            var restaurant = await GetUserRestaurantAsync();
            if (restaurant == null) return Unauthorized();

            var cat = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.RestaurantId == restaurant.Id);

            if (cat == null) return NotFound(new { message = "kategori bulunamadı" });

            _context.Categories.Remove(cat);
            _context.SaveChangesAsync();

            return Ok(new {message= "Başarıyla Silindi"});

        }


    }
}
