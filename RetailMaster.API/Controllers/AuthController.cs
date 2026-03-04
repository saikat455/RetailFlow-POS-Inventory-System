using Microsoft.AspNetCore.Mvc;
using POSSystem.DTOs;
using POSSystem.Services;

namespace POSSystem.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _auth;
        public AuthController(AuthService auth) => _auth = auth;

        /// <summary>
        /// Step 1: A new business owner creates their company + first Admin account.
        /// Returns JWT immediately so they are logged in right away.
        /// </summary>
        [HttpPost("create-company")]
        public async Task<IActionResult> CreateCompany(CreateCompanyDto dto)
        {
            var (success, message, data) = await _auth.CreateCompanyAsync(dto);
            if (!success) return BadRequest(new { message });
            return Ok(data);
        }

        /// <summary>
        /// Step 2: A Cashier registers using the InviteCode from their Admin.
        /// They are automatically assigned to the correct company.
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var (success, message) = await _auth.RegisterAsync(dto);
            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var (success, message, data) = await _auth.LoginAsync(dto);
            if (!success) return Unauthorized(new { message });
            return Ok(data);
        }
    }
}