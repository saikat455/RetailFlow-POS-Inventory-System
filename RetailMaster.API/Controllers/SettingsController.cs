using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POSSystem.DTOs;
using POSSystem.Services;

namespace POSSystem.Controllers
{
    [ApiController]
    [Route("api/settings")]
    [Authorize]
    public class SettingsController : ControllerBase
    {
        private readonly SettingsService _settings;
        public SettingsController(SettingsService settings) => _settings = settings;

        // GET /api/settings/me
        [HttpGet("me")]
        public async Task<IActionResult> GetProfile()
        {
            var r = await _settings.GetProfileAsync();
            return r == null ? NotFound() : Ok(r);
        }

        // PUT /api/settings/me
        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile(UpdateProfileDto dto)
        {
            var (ok, msg) = await _settings.UpdateProfileAsync(dto);
            return ok ? Ok(new { message = msg }) : BadRequest(new { message = msg });
        }

        // GET /api/settings/company  (Admin only)
        [HttpGet("company")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetCompany()
        {
            var r = await _settings.GetCompanyAsync();
            return r == null ? NotFound() : Ok(r);
        }

        // PUT /api/settings/company  (Admin only)
        [HttpPut("company")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCompany(UpdateCompanyDto dto)
        {
            var (ok, msg) = await _settings.UpdateCompanyAsync(dto);
            return ok ? Ok(new { message = msg }) : BadRequest(new { message = msg });
        }

        // GET /api/settings/users  (Admin only)
        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsers() =>
            Ok(await _settings.GetUsersAsync());

        // DELETE /api/settings/users/{id}  (Admin only)
        [HttpDelete("users/{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var (ok, msg) = await _settings.DeleteUserAsync(id);
            return ok ? Ok(new { message = msg }) : BadRequest(new { message = msg });
        }
    }
}
