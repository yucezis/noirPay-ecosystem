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

        [HttpGet("active-table/{tableId}")]
        public async Task<IActionResult> GetActiveOrderForTable(Guid tableId)
        {
            var activeOrder = await _context.Orders
                .Include(o => o.Table)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Where(o => o.IsActive && o.TableId == tableId)
                .Select(o => new
                {
                    Id = o.Id,
                    TableId = o.TableId,
                    TableName = o.Table != null ? $"{o.Table.Name} {o.Table.TableNo}" : "Bilinmeyen Masa",
                    TotalAmount = o.TotalAmount,
                    Items = o.OrderItems.Select(oi => new
                    {
                        Id = oi.Id, 
                        Name = oi.Product != null ? oi.Product.Name : "İsimsiz Ürün",
                        Quantity = oi.Quantity,
                        Price = oi.UnitPrice,
                        IsPaid = oi.IsPaid 
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (activeOrder == null)
            {
                return NotFound(new { message = "Bu masada aktif bir hesap bulunamadı." });
            }

            return Ok(activeOrder);
        }


        [HttpPost("split-equally/{tableId}")]
        public async Task<IActionResult> SplitBillEqually(Guid tableId, [FromBody] SplitEquallyRequest request)
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

        [HttpPost("pay-selected-item/{tableId}")]
        public async Task<IActionResult> PaySelectedItem(Guid tableId, [FromBody] PayItemsRequest request)
        {
            if (request.ItemIds == null || !request.ItemIds.Any()) return BadRequest(new { message = "Lütfen ödenecek ürünleri seçiniz" });

            var activeOrder = await _context.Orders.Include(o=>o.OrderItems)
                .FirstOrDefaultAsync(o => o.TableId == tableId && o.IsActive);

            if(activeOrder == null) return NotFound(new {message="Bu masada aktif bir hesap bulunamadı"});

            var itemsToPay = activeOrder.OrderItems
                .Where(i => request.ItemIds.Contains(i.Id) && !i.IsPaid)
                .ToList();


            if (!itemsToPay.Any())
                return BadRequest(new { message = "Seçilen ürünler bulunamadı veya zaten ödenmiş." });

            foreach (var item in itemsToPay)
            {
                item.IsPaid = true;
            }

            bool AllItemsPaid = activeOrder.OrderItems.All(i=>i.IsPaid);

            if(AllItemsPaid) activeOrder.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Seçilen ürünlerin ödemesi başarıyla alındı.",
                PaidItemsCount = itemsToPay.Count,
                IsTableClosed = AllItemsPaid
            });
        }

        [HttpPost("pay-by-amount/{tableId}")]
        public async Task<IActionResult> PayByAmount(Guid tableId, [FromBody] PayAmountRequest request)
        {
            if (request.Amount <= 0) return BadRequest(new { message = "Lütfen geçerli bir ödeme tutarı giriniz." });

            var activeOrder = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.TableId == tableId && o.IsActive);

            if (activeOrder == null)
                return NotFound(new { message = "Bu masada aktif bir hesap bulunamadı." });

            var unpaidItems = activeOrder.OrderItems
                .Where(i => !i.IsPaid)
                .OrderBy(i => i.UnitPrice)
                .ToList();

            decimal remainingAmount = request.Amount;
            int paidItemsCount = 0;

            foreach (var item in unpaidItems)
            {
                decimal itemTotalPrice = item.UnitPrice * item.Quantity;

                if (remainingAmount >= itemTotalPrice)
                {
                    item.IsPaid = true;
                    remainingAmount -= itemTotalPrice;
                    paidItemsCount++;
                }
                else
                {
                    break;
                }
            }

            if (paidItemsCount == 0)
                return BadRequest(new { message = "Girdiğiniz tutar masadaki en ucuz ürünü ödemeye bile yetmiyor." });

            bool isAllPaid = activeOrder.OrderItems.All(i => i.IsPaid);
            if (isAllPaid)
            {
                activeOrder.IsActive = false;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = $"{paidItemsCount} adet ürünün ödemesi alındı.",
                RemainingChange = remainingAmount, 
                IsTableClosed = isAllPaid
            });
        } 

    }
}
