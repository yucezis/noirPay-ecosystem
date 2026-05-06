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
            var activeOrder = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.TableId == tableId && o.IsActive);

            if (activeOrder == null)
                return NotFound(new { message = "Bu masada aktif bir hesap bulunamadı" });

            decimal totalAmount = activeOrder.TotalAmount;
            int peopleCount = request.NumberOfPeople;

            decimal baseShare = Math.Round(totalAmount / peopleCount, 2, MidpointRounding.ToZero);
            decimal kalan = totalAmount - (baseShare * peopleCount);

            var unpaidItems = activeOrder.OrderItems.Where(i => !i.IsPaid).OrderBy(i => i.UnitPrice).ToList();
            decimal remainingTotal = unpaidItems.Sum(i => i.UnitPrice * i.Quantity);

            decimal amountToPay = (remainingTotal <= baseShare + kalan) ? remainingTotal : baseShare;

            var paymentResult = await _paymentService.ProcessPaymentAsync(
                amountToPay,
                request.CardNumber,
                request.ExpireMonth,
                request.ExpireYear,
                request.Cvc
            );

            if (!paymentResult.IsSuccess)
            {
                return BadRequest(new { message = paymentResult.Message });
            }

            decimal currentPaymentPool = amountToPay;
            int paidItemsCount = 0;

            foreach (var item in unpaidItems)
            {
                decimal itemTotalPrice = item.UnitPrice * item.Quantity;

                if (currentPaymentPool >= itemTotalPrice)
                {
                    item.IsPaid = true;
                    currentPaymentPool -= itemTotalPrice;
                    paidItemsCount++;
                }
                else
                {
                    break; 
                }
            }

            bool isAllPaid = activeOrder.OrderItems.All(i => i.IsPaid);
            if (isAllPaid)
            {
                activeOrder.IsActive = false;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = $"{amountToPay} TL tutarındaki eşit pay başarıyla çekildi.",
                TransactionId = paymentResult.TransactionId,
                IsTableClosed = isAllPaid
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

            decimal totalAmount = itemsToPay.Sum(i => i.UnitPrice * i.Quantity);

            var paymentResult = await _paymentService.ProcessPaymentAsync(
                totalAmount,
                request.CardNumber,
                request.ExpireMonth,
                request.ExpireYear,
                request.Cvc);

            if (!paymentResult.IsSuccess)
            {
                return BadRequest(new { message = paymentResult.Message });
            }

            foreach (var item in itemsToPay)
            {
                item.IsPaid = true;
            }

            bool AllItemsPaid = activeOrder.OrderItems.All(i => i.IsPaid);
            if (AllItemsPaid) activeOrder.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Seçilen ürünlerin ödemesi başarıyla alındı.",
                TransactionId = paymentResult.TransactionId, 
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
            decimal totalAmountToCharge = 0; 
            var itemsToMarkPaid = new List<OrderItem>();

            foreach (var item in unpaidItems)
            {
                decimal itemTotalPrice = item.UnitPrice * item.Quantity;

                if (remainingAmount >= itemTotalPrice)
                {
                    itemsToMarkPaid.Add(item);
                    remainingAmount -= itemTotalPrice;
                    totalAmountToCharge += itemTotalPrice;
                }
                else
                {
                    break;
                }
            }

            if (!itemsToMarkPaid.Any())
                return BadRequest(new { message = "Girdiğiniz tutar masadaki en ucuz ürünü tam olarak ödemeye yetmiyor." });

            var paymentResult = await _paymentService.ProcessPaymentAsync(
                totalAmountToCharge,
                request.CardNumber,
                request.ExpireMonth,
                request.ExpireYear,
                request.Cvc
            );

            if (!paymentResult.IsSuccess)
            {
                return BadRequest(new { message = paymentResult.Message });
            }

            foreach (var item in itemsToMarkPaid)
            {
                item.IsPaid = true;
            }

            bool isAllPaid = activeOrder.OrderItems.All(i => i.IsPaid);
            if (isAllPaid)
            {
                activeOrder.IsActive = false;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = $"{itemsToMarkPaid.Count} adet ürün için toplam {totalAmountToCharge} TL başarıyla çekildi.",
                TransactionId = paymentResult.TransactionId,
                RemainingChange = remainingAmount, 
                IsTableClosed = isAllPaid
            });
        }
    } 
}
