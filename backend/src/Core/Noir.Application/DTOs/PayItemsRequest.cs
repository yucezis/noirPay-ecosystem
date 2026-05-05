using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Application.DTOs
{
    public class PayItemsRequest
    {
        public List<Guid> ItemIds { get; set; } = new List<Guid>();
    }
}
