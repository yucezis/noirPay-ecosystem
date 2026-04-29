using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Noir.Domain.Entities;
using Noir.Application.Interfaces;
using Noir.Application.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Noir.Application.Services
{
    public class OrderService : IOrderService
    {
        private readonly INoirDbContext _context;

        public OrderService(INoirDbContext context)
        {
            _context = context;
        }

        public async Task<OrderResponse> StartOrGetOrderSessionAsync(ScanQrRequest request)
        {
            var existingOrder = await _context.Orders
                .FirstOrDefaultAsync(o => o.TableId == request.TableId && o.IsActive);

            if (existingOrder != null)
            {
                return new OrderResponse
                {
                    OrderId = existingOrder.Id,
                    TableId = existingOrder.TableId,
                    IsNewSession = false,
                    CreatedAt = existingOrder.CreatedAt,
                    IsActive = existingOrder.IsActive
                };
            }

            var newOrder = new Order
            {
                Id = Guid.NewGuid(),
                TableId = request.TableId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Orders.AddAsync(newOrder);
            await _context.SaveChangesAsync();

            return new OrderResponse
            {
                OrderId = newOrder.Id,
                TableId = newOrder.TableId,
                IsNewSession = true,
                CreatedAt = newOrder.CreatedAt,
                IsActive = newOrder.IsActive
            };
        }
    }

}
