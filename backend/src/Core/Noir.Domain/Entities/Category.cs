using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Domain.Entities
{
    public class Category : BaseEntity
    {
        public string Name {  get; set; } = string.Empty;

        public Guid RestaurantId { get; set; }
        public Restaurant? Restaurant { get; set; }

        public ICollection<Product> Products { get; set; } = new List<Product>();

    }
}
