using Microsoft.AspNetCore.Mvc;
using System;
using Microsoft.AspNetCore.Authorization;
using Noir.Application.DTOs;
using System.Security.Claims;
using Noir.Domain.Entities;
using Noir.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;


namespace Noir.API.Controllers
{
   
        [ApiController]
        [Route("api/[controller]")]
        public class OrderController : ControllerBase
        {
            private readonly NoirDbContext _context; 

            public OrderController(NoirDbContext context)
            {
                _context = context;
            }

        [HttpGet("active/{restaurantId}")]
        public async Task<IActionResult> GetActiveOrders(Guid restaurantId)
        {
            var activeOrders = await _context.Orders
                .Include(o => o.Table)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Where(o => o.IsActive && o.RestaurantId == restaurantId)
                .OrderByDescending(o => o.CreatedAt) 
                .Select(o => new
                {
                    Id = o.Id,
                    TableName = o.Table != null ? o.Table.Name : "Bilinmeyen Masa",
                    TableId = o.TableId,
                    TotalAmount = o.TotalAmount,
                    CreatedAt = o.CreatedAt,
                    Items = o.OrderItems.Select(oi => new
                    {
                        Name = oi.Product != null ? oi.Product.Name : "Silinmiş Ürün",
                        Quantity = oi.Quantity,
                        Price = oi.UnitPrice 
                    })
                })
                .ToListAsync();

            return Ok(activeOrders);
        }

        [HttpPost("complete/{orderId}")]
            public async Task<IActionResult> CompleteOrder(Guid orderId)
            {
                var order = await _context.Orders.FindAsync(orderId);
                if (order == null) return NotFound();

                order.IsActive = false; 
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Sipariş tamamlandı." });
            }
        }
}
