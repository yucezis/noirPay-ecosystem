using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Application.DTOs
{
    public class OrderResponse
    {
        public Guid OrderId { get; set; }
        public Guid TableId { get; set; }
        public bool IsNewSession { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
