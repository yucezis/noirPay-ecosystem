using Noir.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Noir.Domain.Entities;
using Noir.Infrastructure.Contexts;

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
                return Unauthorized(new {message = "Geçersiz veya eksik kimlik bilgisi"});
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
                        IsActive = true
                    });
                }
            }

            await _context.AddAsync(restaurant);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { message = "Restoran başarıyla oluşturuldu.", restaurantId = restaurant.Id });

        }


        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRestaurant(Guid id)
        {
            var restaurant = await _context.Restaurants.FindAsync(id);

            if (restaurant == null)
            {
                return NotFound("Restoran bulunamadı.");
            }

            return Ok(new
            {
                Id = restaurant.Id,
                Name = restaurant.Name,
                Location = restaurant.Address 
            });
        }

    }

}
