using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Application.DTOs
{
    public class CreateTableDto
    {
        public string Name { get; set; } = string.Empty;
        public string TableNo { get; set; } = string.Empty;
    }
}
