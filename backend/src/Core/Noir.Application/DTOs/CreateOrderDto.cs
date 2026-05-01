using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Application.DTOs
{
    public class CreateOrderDto
    {
        public string RestaurantId { get; set; }

        public string TableId { get; set; }

        public List<OrderItemDto> CartItems { get; set; } = new List<OrderItemDto>();
    }
}
