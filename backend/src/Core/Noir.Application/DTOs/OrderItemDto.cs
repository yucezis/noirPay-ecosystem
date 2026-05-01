using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Application.DTOs
{
    public class OrderItemDto
    {
        public string Id { get; set; } 
        public string Name { get; set; } 
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
}
