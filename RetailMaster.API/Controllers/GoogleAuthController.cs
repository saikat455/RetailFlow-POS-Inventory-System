using Microsoft.AspNetCore.Mvc;
using POSSystem.DTOs;
using POSSystem.Services;

namespace POSSystem.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class GoogleAuthController : ControllerBase
    {
        private readonly GoogleAuthService _google;
        public GoogleAuthController(GoogleAuthService google) => _google = google;

        // POST /api/auth/google
        // Body: { idToken: "...", inviteCode: "XK4T2P" (optional) }
        [HttpPost("google")]
        public async Task<IActionResult> Google([FromBody] GoogleLoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.IdToken))
                return BadRequest(new { message = "idToken is required." });

            var (ok, msg, data) = await _google.HandleAsync(dto);

            if (!ok)  return BadRequest(new { message = msg });
            if (data?.NeedsInviteCode == true) return Ok(data); // FE shows invite code step
            return Ok(data);
        }
    }
}
