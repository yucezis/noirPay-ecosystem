using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Application.DTOs
{
    public class CreateRestaurantRequest
    {
        public string Name {  get; set; } = string.Empty;
        public string? BranchInfo { get; set; }
        public string? Address { get; set; }
        public string? PhoneNumber { get; set; }
        public int TableCount { get; set; }
    }
}
