using Noir.Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using System.Text.RegularExpressions;

namespace Noir.API.Hubs
{
    public class OrderHub : Hub
    {
        public async Task JoinGroup(string groupId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupId);
        }

        public async Task SendOrder(string restaurantId, string tableId, object orderDetails)
        {
            await Clients.Group($"Restorant_{restaurantId}")
                .SendAsync("Yeni sipariş", new { TableId = tableId, Details = orderDetails });

            await Clients.Caller.SendAsync("Siparişiniz mutfağa iletildi");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }

    }
}
