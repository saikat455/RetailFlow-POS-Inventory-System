using Microsoft.EntityFrameworkCore;
using POSSystem.Data;
using POSSystem.DTOs;

namespace POSSystem.Services
{
    public class SettingsService
    {
        private readonly AppDbContext           _db;
        private readonly ICurrentCompanyService _ctx;

        public SettingsService(AppDbContext db, ICurrentCompanyService ctx)
        {
            _db = db; _ctx = ctx;
        }

        // ── Get own profile ───────────────────────────────────
        public async Task<ProfileDto?> GetProfileAsync()
        {
            var user = await _db.Users
                .Include(u => u.Branch)
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Id == _ctx.UserId && !u.IsDeleted);

            if (user == null) return null;

            return new ProfileDto
            {
                Id          = user.Id,
                Name        = user.Name,
                Email       = user.Email,
                Role        = user.Role,
                BranchId    = user.BranchId,
                BranchName  = user.Branch?.Name,
                CompanyName = user.Company?.Name ?? string.Empty,
                JoinedAt    = user.CreatedAt,
            };
        }

        // ── Update own profile ────────────────────────────────
        public async Task<(bool ok, string msg)> UpdateProfileAsync(UpdateProfileDto dto)
        {
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == _ctx.UserId && !u.IsDeleted);
            if (user == null) return (false, "User not found.");

            if (string.IsNullOrWhiteSpace(dto.Name))
                return (false, "Name cannot be empty.");

            // Handle password change
            if (!string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                if (string.IsNullOrWhiteSpace(dto.CurrentPassword))
                    return (false, "Current password is required to set a new password.");

                if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                    return (false, "Current password is incorrect.");

                if (dto.NewPassword.Length < 6)
                    return (false, "New password must be at least 6 characters.");

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            }

            user.Name      = dto.Name.Trim();
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Profile updated successfully.");
        }

        // ── Get company details (Admin) ───────────────────────
        public async Task<CompanyDetailDto?> GetCompanyAsync()
        {
            var companyId = _ctx.CompanyId;
            var company   = await _db.Companies
                .FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted);
            if (company == null) return null;

            var userCount   = await _db.Users.CountAsync(u => u.CompanyId == companyId && !u.IsDeleted);
            var branchCount = await _db.Branches.CountAsync(b => b.CompanyId == companyId && !b.IsDeleted);

            return new CompanyDetailDto
            {
                Id          = company.Id,
                Name        = company.Name,
                Address     = company.Address,
                Phone       = company.Phone,
                InviteCode  = company.InviteCode,
                UserCount   = userCount,
                BranchCount = branchCount,
                CreatedAt   = company.CreatedAt,
            };
        }

        // ── Update company info (Admin only) ──────────────────
        public async Task<(bool ok, string msg)> UpdateCompanyAsync(UpdateCompanyDto dto)
        {
            if (!_ctx.IsAdmin) return (false, "Admins only.");

            if (string.IsNullOrWhiteSpace(dto.Name))
                return (false, "Company name cannot be empty.");

            var company = await _db.Companies
                .FirstOrDefaultAsync(c => c.Id == _ctx.CompanyId && !c.IsDeleted);
            if (company == null) return (false, "Company not found.");

            company.Name      = dto.Name.Trim();
            company.Address   = dto.Address?.Trim();
            company.Phone     = dto.Phone?.Trim();
            company.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Company details updated.");
        }

        // ── Admin: list all users in company ──────────────────
        public async Task<List<ProfileDto>> GetUsersAsync()
        {
            if (!_ctx.IsAdmin) return new();
            var companyId = _ctx.CompanyId;

            return await _db.Users
                .Include(u => u.Branch)
                .Where(u => u.CompanyId == companyId && !u.IsDeleted)
                .OrderBy(u => u.Role).ThenBy(u => u.Name)
                .Select(u => new ProfileDto
                {
                    Id         = u.Id,
                    Name       = u.Name,
                    Email      = u.Email,
                    Role       = u.Role,
                    BranchId   = u.BranchId,
                    BranchName = u.Branch != null ? u.Branch.Name : null,
                    CompanyName = string.Empty,
                    JoinedAt   = u.CreatedAt,
                })
                .ToListAsync();
        }

        // ── Admin: soft-delete a user ─────────────────────────
        public async Task<(bool ok, string msg)> DeleteUserAsync(int userId)
        {
            if (!_ctx.IsAdmin) return (false, "Admins only.");
            if (userId == _ctx.UserId) return (false, "You cannot delete your own account.");

            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == userId && u.CompanyId == _ctx.CompanyId && !u.IsDeleted);
            if (user == null) return (false, "User not found.");

            user.IsDeleted = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "User removed.");
        }
    }
}
