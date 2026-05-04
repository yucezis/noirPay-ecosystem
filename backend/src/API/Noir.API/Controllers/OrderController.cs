using Microsoft.AspNetCore.Mvc;
using System;
using Microsoft.AspNetCore.Authorization;
using Noir.Application.DTOs;
using System.Security.Claims;
using Noir.Domain.Entities;
using Noir.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Noir.API.Hubs;


namespace Noir.API.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly NoirDbContext _context;
        private readonly IHubContext<OrderHub> _hubContext;

        public OrderController(NoirDbContext context, IHubContext<OrderHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
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

            if (order == null)
                return NotFound(new { Message = "Sipariş bulunamadı." });

            order.IsActive = false;

            await _context.SaveChangesAsync();
            await _hubContext.Clients.Group(order.TableId.ToString()).SendAsync("StatusUpdated", "Siparişiniz Teslim Edildi");

            return Ok(new { Message = "Sipariş başarıyla tamamlandı ve arşivlendi." });
        }

        [HttpPost("request-bill/{tableId}")]
        public async Task<IActionResult> RequestBill(Guid tableId)
        {
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.TableId == tableId && o.IsActive);

            if (order == null) return NotFound(new { Message = "Aktif hesap bulunamadı." });

            await _hubContext.Clients.Group($"Restaurant_{order.RestaurantId}")
                .SendAsync("BillRequested", new
                {
                    TableId = tableId,
                    TableName = order.Table?.Name,
                    TotalAmount = order.TotalAmount
                });

            return Ok(new { Message = "Hesap talebi iletildi." });
        }
    }
}
