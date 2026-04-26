using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Domain.Entities
{
    public class Order : BaseEntity
    {
        public decimal TotalAmount { get; set; }
        public bool IsActive { get; set; } = true; // Hesap ödenip bitince false olacak

        // İlişki: Bu adisyon hangi masaya ait?
        public Guid TableId { get; set; }
        public Table? Table { get; set; }

        // İlişki: Bu adisyonun içinde hangi kalemler var?
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
