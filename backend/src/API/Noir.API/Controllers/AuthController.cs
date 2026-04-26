using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Noir.Application.Abstractions;
using Noir.Application.DTOs;
using Noir.Domain.Entities;
using Noir.Infrastructure.Contexts;
using BCrypt.Net;

namespace Noir.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly NoirDbContext _context;
        private readonly IJwtProvider _jwtProvider;

        public AuthController(NoirDbContext context, IJwtProvider jwtProvider)
        {
            _context = context;
            _jwtProvider = jwtProvider;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return Unauthorized(new { message = "Eposta veya şifre hatalı" });

            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                return Unauthorized(new { message = "Eposta veya şifre hatalı" });
            }

            string accessToken = _jwtProvider.GenerateToken(user.Id, user.Email);

            string refreshToken = Guid.NewGuid().ToString();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

            await _context.SaveChangesAsync();

            return Ok(new AuthReponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            });
        }
    }
}
