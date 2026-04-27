using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Domain.Entities
{
    public class Table : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string TableNo { get; set; } = string.Empty;
        public string QrCodeId { get; set; } = Guid.NewGuid().ToString();

        public Guid RestaurantId { get; set; }  // Bu masa hangi restoranta ait
        public Restaurant? Restaurant { get; set; }

        public ICollection<Order> Orders { get; set; } = new List<Order>();


    }
}
