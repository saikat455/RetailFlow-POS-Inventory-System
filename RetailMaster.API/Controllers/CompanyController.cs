using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POSSystem.Data;
using POSSystem.DTOs;
using POSSystem.Services;

namespace POSSystem.Controllers
{
    [ApiController]
    [Route("api/company")]
    [Authorize]
    public class CompanyController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ICurrentCompanyService _ctx;

        public CompanyController(AppDbContext db, ICurrentCompanyService ctx)
        {
            _db = db;
            _ctx = ctx;
        }

        // ── GET /api/company ── Admin only ──
        // Returns this company's info including InviteCode.
        // CompanyId from JWT — Admin cannot query another company.
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetMyCompany()
        {
            var companyId = _ctx.CompanyId;

            var company = await _db.Companies
                .Where(c => c.Id == companyId && !c.IsDeleted)
                .FirstOrDefaultAsync();

            if (company == null) return NotFound(new { message = "Company not found." });

            return Ok(new CompanyResponseDto
            {
                Id         = company.Id,
                Name       = company.Name,
                InviteCode = company.InviteCode,
                Address    = company.Address,
                Phone      = company.Phone,
            });
        }

        // ── GET /api/company/users ── Admin only ──
        // Lists users in this company ONLY. Never shows users from other companies.
        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsers()
        {
            var companyId = _ctx.CompanyId;

            var users = await _db.Users
                .Where(u => u.CompanyId == companyId && !u.IsDeleted)   // ← explicit filter
                .OrderBy(u => u.Name)
                .Select(u => new
                {
                    u.Id, u.Name, u.Email, u.Role, u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // ── GET /api/company/validate-invite/{code} ── Public ──
        // Used by Register page to preview company name before submitting.
        [HttpGet("validate-invite/{code}")]
        [AllowAnonymous]
        public async Task<IActionResult> ValidateInvite(string code)
        {
            var company = await _db.Companies
                .Where(c => c.InviteCode == code.ToUpper().Trim()
                         && c.IsActive
                         && !c.IsDeleted)
                .Select(c => new { c.Name })
                .FirstOrDefaultAsync();

            if (company == null)
                return NotFound(new { message = "Invalid invite code." });

            return Ok(new { companyName = company.Name });
        }

        // ── DELETE /api/company/users/{userId} ── Admin only (soft delete user) ──
        // Admin can only soft-delete users from their own company.
        [HttpDelete("users/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveUser(int userId)
        {
            var companyId = _ctx.CompanyId;

            // Prevent Admin from accidentally deleting themselves
            if (userId == _ctx.UserId)
                return BadRequest(new { message = "You cannot delete your own account." });

            var user = await _db.Users
                .Where(u => u.Id == userId && u.CompanyId == companyId && !u.IsDeleted)  // ← explicit filter
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound(new { message = "User not found in your company." });

            user.IsDeleted = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = $"User '{user.Name}' has been removed." });
        }
    }
}