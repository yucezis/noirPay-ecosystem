using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Noir.Domain.Entities; 
using Noir.Application.DTOs;
using Noir.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Noir.API.Hubs
{
    public class OrderHub : Hub
    {
        private readonly NoirDbContext _context; 

        public OrderHub(NoirDbContext context)
        {
            _context = context;
        }

        public async Task JoinGroup(string groupId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupId);
        }

        public async Task UpdateCart(string groupId, object newCart)
        {
            await Clients.OthersInGroup(groupId).SendAsync("ReceiveCartUpdate", newCart);
        }

        public async Task SendOrder(string restaurantId, string tableId, List<OrderItemDto> cartItems)
        {
            Guid actualTableGuid;

            if (!Guid.TryParse(tableId, out actualTableGuid))
            {
                var tableEntry = await _context.Tables
                    .FirstOrDefaultAsync(t => t.Name == tableId && t.RestaurantId == Guid.Parse(restaurantId));

                if (tableEntry != null)
                {
                    actualTableGuid = tableEntry.Id;
                }
                else
                {
                    tableEntry = await _context.Tables
                        .FirstOrDefaultAsync(t => t.TableNo == tableId && t.RestaurantId == Guid.Parse(restaurantId));

                    if (tableEntry != null)
                    {
                        actualTableGuid = tableEntry.Id;
                    }
                    else
                    {
                        // Veritabanında "A-01" de yoksa hata fırlat (Ya da test için alttaki satırı aç)
                        // actualTableGuid = Guid.Parse("BURAYA_SQLDEN_BIR_ID_YAZIN"); 
                        throw new HubException($"Veritabanında '{tableId}' numaralı bir masa bulunamadı!");
                    }
                }
            }

                var newOrder = new Order
                {
                Id = Guid.NewGuid(),
                RestaurantId = Guid.Parse(restaurantId),
                TableId = actualTableGuid,
                TotalAmount = cartItems.Sum(x => x.Price * x.Quantity),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                OrderItems = cartItems.Select(item => new OrderItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = Guid.Parse(item.Id),
                    Quantity = item.Quantity,
                    UnitPrice = item.Price,
                    IsPaid = false
                }).ToList()
                };

            _context.Orders.Add(newOrder);
            await _context.SaveChangesAsync();

            await Clients.Group($"Restorant_{restaurantId}").SendAsync("Yeni sipariş", new
            {
                TableId = tableId,
                Details = cartItems,
                OrderId = newOrder.Id.ToString()
            });

            await Clients.Caller.SendAsync("Siparişiniz mutfağa iletildi");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}