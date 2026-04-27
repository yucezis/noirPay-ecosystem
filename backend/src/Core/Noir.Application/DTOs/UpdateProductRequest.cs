using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Application.DTOs
{
     public class UpdateProductRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; }

        public Guid CategoryId { get; set; }
    }
}
