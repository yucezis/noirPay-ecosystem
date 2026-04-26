using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Domain.Entities
{
    public class OrderItem : BaseEntity
    {
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; } // Sipariş verildiği anki fiyat (İleride zam gelirse eski faturalar bozulmasın diye)

        // PARÇALI ÖDEME İÇİN KRİTİK ALANLAR
        public bool IsPaid { get; set; } = false; // Bu ödendi mi?
        public string? PaidBy { get; set; } // Kim ödedi? (Müşterinin geçici session ID'si)

        // İlişki: Hangi faturanın kalemi?
        public Guid OrderId { get; set; }
        public Order? Order { get; set; }

        // İlişki: Hangi ürün söylendi?
        public Guid ProductId { get; set; }
        public Product? Product { get; set; }
    }
}
