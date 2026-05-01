using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Noir.Domain.Entities; 
using Noir.Application.DTOs;
using Noir.Infrastructure.Contexts;

namespace Noir.API.Hubs
{
    public class OrderHub : Hub
    {
        // Veritabanı bağlantısı
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
            var newOrder = new Order
            {
                Id = Guid.NewGuid(),
                RestaurantId = Guid.Parse(restaurantId),
                TableId = Guid.Parse(tableId),
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

            await Clients.Group($"Restorant_{restaurantId}")
                .SendAsync("Yeni sipariş", new
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