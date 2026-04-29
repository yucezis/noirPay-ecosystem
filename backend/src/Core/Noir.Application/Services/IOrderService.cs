using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Noir.Application.DTOs;

namespace Noir.Application.Services
{
    public interface IOrderService
    {
        Task<OrderResponse> StartOrGetOrderSessionAsync(ScanQrRequest request);
    }
}
