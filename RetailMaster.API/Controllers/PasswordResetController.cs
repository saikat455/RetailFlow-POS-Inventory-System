using Microsoft.AspNetCore.Mvc;
using POSSystem.DTOs;
using POSSystem.Services;

namespace POSSystem.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class PasswordResetController : ControllerBase
    {
        private readonly PasswordResetService _passwordReset;

        public PasswordResetController(PasswordResetService passwordReset)
        {
            _passwordReset = passwordReset;
        }

        /// <summary>
        /// Request password reset email
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Invalid request." });

            var (success, message) = await _passwordReset.ForgotPasswordAsync(dto);
            
            // Always return 200 OK to prevent email enumeration
            return Ok(new { message });
        }

        /// <summary>
        /// Validate reset token (used by frontend to check token validity)
        /// </summary>
        [HttpPost("verify-reset-token")]
        public async Task<IActionResult> VerifyToken(VerifyTokenDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest(new { message = "Token is required." });

            var (valid, message) = await _passwordReset.ValidateTokenAsync(dto.Token);
            
            if (!valid)
                return BadRequest(new { message });

            return Ok(new { valid = true });
        }

        /// <summary>
        /// Reset password with token
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Invalid request." });

            var (success, message) = await _passwordReset.ResetPasswordAsync(dto);
            
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }
    }
}