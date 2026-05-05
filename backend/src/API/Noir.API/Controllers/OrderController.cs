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

        [HttpPost("split-equally/{tableId}")]
        public async Task<IActionResult> SplitBillEqually(string tableId, [FromBody] SplitEquallyRequest request)
        {
            var activeOrder = await _context.Orders.FirstOrDefaultAsync(o => o.TableId == tableId && o.IsActive);

            if (activeOrder == null)
                return NotFound(new { message = "Bu masada aktif bir hesap bulunamadı" });

            decimal totalAmount = activeOrder.TotalAmount;
            int peopleCount = request.NumberOfPeople;

            decimal baseShare = Math.Round(totalAmount / peopleCount, 2, MidpointRounding.ToZero);
            decimal kalan = totalAmount - (baseShare * peopleCount);

            var splitResult = new List<Decimal>();

            for (int i = 0; i < peopleCount; i++)
            {
                if(i == peopleCount - 1) splitResult.Add(baseShare+kalan);
                else splitResult.Add(baseShare);
            }

            return Ok(new
            {
                TableId = tableId,
                TotalAmount = totalAmount,
                NumberOfPeople = peopleCount,
                Shares = splitResult
            });
        }
    }
}
