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
using Noir.Application.Interfaces;



namespace Noir.API.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly NoirDbContext _context;
        private readonly IHubContext<OrderHub> _hubContext;
        private readonly IPaymentService _paymentService;

        public OrderController(NoirDbContext context, IHubContext<OrderHub> hubContext, IPaymentService paymentService)
        {
            _context = context;
            _hubContext = hubContext;
            _paymentService = paymentService;
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
                    PaidAmount = o.PaidAmount, 
                    RemainingAmount = o.TotalAmount - o.PaidAmount,
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

            if (activeOrder == null) return NotFound(new { message = "Bu masada aktif bir hesap bulunamadı." });
            

            return Ok(activeOrder);
        }


        [HttpPost("split-equally/{tableId}")]
        public async Task<IActionResult> SplitBillEqually(Guid tableId, [FromBody] SplitEquallyRequest request)
        {
            var activeOrder = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.TableId == tableId && o.IsActive);
            if (activeOrder == null) return NotFound(new { message = "Bu masada aktif bir hesap bulunamadı" });

            decimal remainingTotal = activeOrder.TotalAmount - activeOrder.PaidAmount;
            int peopleCount = request.NumberOfPeople;

            decimal baseShare = Math.Round(remainingTotal / peopleCount, 2, MidpointRounding.ToZero);
            decimal kalan = remainingTotal - (baseShare * peopleCount);

            decimal amountToPay = (remainingTotal <= baseShare + kalan) ? remainingTotal : baseShare;

            var paymentResult = await _paymentService.ProcessPaymentAsync(amountToPay, request.CardNumber, request.ExpireMonth, request.ExpireYear, request.Cvc);
            if (!paymentResult.IsSuccess) return BadRequest(new { message = paymentResult.Message });

            activeOrder.PaidAmount += amountToPay;

            bool isAllPaid = activeOrder.PaidAmount >= activeOrder.TotalAmount;
            if (isAllPaid)
            {
                activeOrder.IsActive = false;
                activeOrder.PaidAmount = activeOrder.TotalAmount; 
                foreach (var item in activeOrder.OrderItems) item.IsPaid = true;
            }

            await CheckAndCloseOrderAsync(activeOrder);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = $"{amountToPay} TL tutarındaki pay başarıyla çekildi.",
                TransactionId = paymentResult.TransactionId,
                IsTableClosed = isAllPaid
            });
        }

        [HttpPost("pay-selected-item/{tableId}")]
        public async Task<IActionResult> PaySelectedItem(Guid tableId, [FromBody] PayItemsRequest request)
        {
            if (request.ItemIds == null || !request.ItemIds.Any()) return BadRequest(new { message = "Lütfen ödenecek ürünleri seçiniz" });

            var activeOrder = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.TableId == tableId && o.IsActive);
            if (activeOrder == null) return NotFound(new { message = "Bu masada aktif bir hesap bulunamadı" });

            var requestedCounts = request.ItemIds.GroupBy(id => id).ToDictionary(g => g.Key, g => g.Count());
            var itemsToPay = activeOrder.OrderItems.Where(i => requestedCounts.ContainsKey(i.Id) && !i.IsPaid).ToList();

            if (!itemsToPay.Any()) return BadRequest(new { message = "Seçilen ürünler bulunamadı veya zaten ödenmiş." });

            decimal totalAmountToCharge = 0;
            foreach (var item in itemsToPay)
            {
                int count = requestedCounts[item.Id];
                if (count > item.Quantity) count = item.Quantity;
                totalAmountToCharge += count * item.UnitPrice;
            }

            var paymentResult = await _paymentService.ProcessPaymentAsync(totalAmountToCharge, request.CardNumber, request.ExpireMonth, request.ExpireYear, request.Cvc);
            if (!paymentResult.IsSuccess) return BadRequest(new { message = paymentResult.Message });

            foreach (var item in itemsToPay)
            {
                int count = requestedCounts[item.Id];
                if (count >= item.Quantity)
                {
                    item.IsPaid = true; 
                }
                else
                {
                    item.Quantity -= count;

                    var paidItem = new OrderItem
                    {
                        OrderId = item.OrderId,
                        ProductId = item.ProductId,
                        Quantity = count,
                        UnitPrice = item.UnitPrice,
                        IsPaid = true
                    };
                    _context.OrderItems.Add(paidItem);
                }
            }

            activeOrder.PaidAmount += totalAmountToCharge;

            bool isAllPaid = activeOrder.PaidAmount >= activeOrder.TotalAmount || activeOrder.OrderItems.All(i => i.IsPaid);
            if (isAllPaid)
            {
                activeOrder.IsActive = false;
                activeOrder.PaidAmount = activeOrder.TotalAmount;
            }

            await CheckAndCloseOrderAsync(activeOrder);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Seçilen ürünlerin ödemesi başarıyla alındı.",
                TransactionId = paymentResult.TransactionId,
                IsTableClosed = isAllPaid
            });
        }

        [HttpPost("pay-by-amount/{tableId}")]
        public async Task<IActionResult> PayByAmount(Guid tableId, [FromBody] PayAmountRequest request)
        {
            if (request.Amount <= 0) return BadRequest(new { message = "Lütfen geçerli bir ödeme tutarı giriniz." });

            var activeOrder = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.TableId == tableId && o.IsActive);
            if (activeOrder == null) return NotFound(new { message = "Bu masada aktif bir hesap bulunamadı." });

            decimal remainingOrderAmount = activeOrder.TotalAmount - activeOrder.PaidAmount;
            decimal amountToCharge = request.Amount > remainingOrderAmount ? remainingOrderAmount : request.Amount;

            var paymentResult = await _paymentService.ProcessPaymentAsync(amountToCharge, request.CardNumber, request.ExpireMonth, request.ExpireYear, request.Cvc);
            if (!paymentResult.IsSuccess) return BadRequest(new { message = paymentResult.Message });

            activeOrder.PaidAmount += amountToCharge;

            bool isAllPaid = activeOrder.PaidAmount >= activeOrder.TotalAmount;
            if (isAllPaid)
            {
                activeOrder.IsActive = false;
                activeOrder.PaidAmount = activeOrder.TotalAmount;
                foreach (var item in activeOrder.OrderItems) item.IsPaid = true;
            }

            await CheckAndCloseOrderAsync(activeOrder);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = $"{amountToCharge} TL başarıyla çekildi.",
                TransactionId = paymentResult.TransactionId,
                RemainingChange = request.Amount > remainingOrderAmount ? request.Amount - remainingOrderAmount : 0,
                IsTableClosed = isAllPaid
            });
        }

        private async Task CheckAndCloseOrderAsync(Order order)
        {
            if (order.PaidAmount >= order.TotalAmount)
            {
                order.IsActive = false;
                order.PaidAmount = order.TotalAmount; 

                await _hubContext.Clients.All.SendAsync("TableStatusChanged", order.TableId, "Empty");
            }
        }
    } 
}
