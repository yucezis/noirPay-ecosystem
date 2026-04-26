using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Application.Abstractions
{
    public interface IJwtProvider
    {
        string GenerateToken(Guid userid, string email);
    }
}
