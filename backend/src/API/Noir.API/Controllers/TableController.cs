using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Noir.Application.DTOs;
using Noir.Domain.Entities;
using Noir.Infrastructure.Contexts;
using System.Security.Claims;

namespace Noir.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TableController : ControllerBase
    {
        private readonly NoirDbContext _context;

        public TableController(NoirDbContext context)
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
        public async Task<IActionResult> CreateTable([FromBody] CreateTableDto request)
        {
            var restaurant = await GetUserRestaurantAsync();
            if (restaurant == null) return Unauthorized(new { message = "Restoran bulunamadı." });

            var table = new Table
            {
                Name = request.Name,
                TableNo = request.TableNo,
                RestaurantId = restaurant.Id
            };

            await _context.Tables.AddAsync(table);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Masa başarıyla eklendi."});
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var restaurant = await GetUserRestaurantAsync();
            if (restaurant == null) return BadRequest();

            var tables = await _context.Tables
                 .Where(t => t.RestaurantId == restaurant.Id)
                 .OrderBy(t => t.TableNo)
                 .Select(t => new
                 {
                     t.Id,
                     t.Name,
                     t.TableNo,
                     t.QrCodeId,
                     t.IsActive
                 })
                 .ToListAsync();

            return Ok(tables);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var restaurant = await GetUserRestaurantAsync();
            if (restaurant == null) return Unauthorized();

            var table = await _context.Tables
                .FirstOrDefaultAsync(t => t.Id == id && t.RestaurantId == restaurant.Id);

            if (table == null) return NotFound("Masa bulunamadı.");

            _context.Tables.Remove(table);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Masa silindi." });
        }
    }
}