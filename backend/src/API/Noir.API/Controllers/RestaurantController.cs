using Noir.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Noir.Domain.Entities;
using Noir.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Noir.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RestaurantController : ControllerBase
    {
        private readonly NoirDbContext _context;

        public RestaurantController(NoirDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateRestaurant([FromBody] CreateRestaurantRequest request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid ownerId))
            {
                return Unauthorized(new { message = "Geçersiz veya eksik kimlik bilgisi" });
            }

            var restaurant = new Restaurant
            {
                Name = request.Name,
                BranchInfo = request.BranchInfo,
                Address = request.Address,
                PhoneNumber = request.PhoneNumber,
                OwnerId = ownerId,
            };

            if (request.TableCount > 0)
            {
                for (int i = 1; i <= request.TableCount; i++)
                {
                    restaurant.Tables.Add(new Table
                    {
                        Name = $"Masa {i}",
                        TableNo = i.ToString(), 
                        IsActive = true
                    });
                }
            }

            await _context.AddAsync(restaurant);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { message = "Restoran başarıyla oluşturuldu.", restaurantId = restaurant.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRestaurant(Guid id, [FromBody] CreateRestaurantRequest request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid ownerId))
            {
                return Unauthorized(new { message = "Geçersiz veya eksik kimlik bilgisi" });
            }

            var restaurant = await _context.Restaurants.FindAsync(id);

            if (restaurant == null)
            {
                return NotFound(new { message = "Restoran bulunamadı." });
            }

            if (restaurant.OwnerId != ownerId)
            {
                return Forbid();
            }

            restaurant.Name = request.Name;
            restaurant.BranchInfo = request.BranchInfo;
            restaurant.Address = request.Address;
            restaurant.PhoneNumber = request.PhoneNumber;

            _context.Restaurants.Update(restaurant);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Restoran bilgileri başarıyla güncellendi." });
        }


        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRestaurant(Guid id)
        {
            var restaurant = await _context.Restaurants
                .Include(r => r.Tables)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (restaurant == null)
            {
                return NotFound(new { message = "Restoran bulunamadı." });
            }

            return Ok(new
            {
                Id = restaurant.Id,
                name = restaurant.Name, 
                branchInfo = restaurant.BranchInfo,
                address = restaurant.Address,
                phoneNumber = restaurant.PhoneNumber,
                tableCount = restaurant.Tables?.Count ?? 0
            });
        }
    }
}