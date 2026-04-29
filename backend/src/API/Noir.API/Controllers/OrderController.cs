using Microsoft.AspNetCore.Mvc;

namespace Noir.API.Controllers
{
    public class OrderController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
