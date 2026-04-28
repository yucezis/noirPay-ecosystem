using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Application.DTOs
{
    public class UpdateCategoryRequest
    {
        public string Name { get; set; } = string.Empty;

        public bool IsActive { get; set; }
    }
}
