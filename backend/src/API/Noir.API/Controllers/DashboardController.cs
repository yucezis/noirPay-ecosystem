using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Noir.Infrastructure.Contexts;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Noir.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly NoirDbContext _context;

        public DashboardController(NoirDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            var now = DateTime.UtcNow;
            var today = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
            var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            decimal dailyRevenue = await _context.Orders
                .Where(o => o.CreatedAt >= today)
                .SumAsync(o => (decimal?)o.PaidAmount) ?? 0;

            decimal monthlyRevenue = await _context.Orders
                .Where(o => o.CreatedAt >= startOfMonth)
                .SumAsync(o => (decimal?)o.PaidAmount) ?? 0;

            int totalOrdersToday = await _context.Orders
                .CountAsync(o => o.CreatedAt >= today);

            int activeTablesCount = await _context.Tables
                .CountAsync(t => t.Orders.Any(o => o.IsActive));

            return Ok(new
            {
                dailyRevenue = dailyRevenue,
                monthlyRevenue = monthlyRevenue,
                totalOrdersToday = totalOrdersToday,
                activeTablesCount = activeTablesCount
            });
        }
    }
}