using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Domain.Entities
{
    public class Restaurant : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public string? BranchInfo { get; set; }

        public string? Address { get; set; }

        public string? PhoneNumber { get; set; }

        public bool IsActive { get; set; } = true;

        public Guid OwnerId { get; set; }

        public ICollection<Table> Tables { get; set; } = new List<Table>();
        public ICollection<Category> Categories { get; set; } = new List<Category>();

    }
}
