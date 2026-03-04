using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using POSSystem.Data;
using POSSystem.DTOs;
using POSSystem.Models;

namespace POSSystem.Services
{
    public class AuthService
    {
        private readonly AppDbContext   _db;
        private readonly IConfiguration _config;

        public AuthService(AppDbContext db, IConfiguration config)
        {
            _db = db; _config = config;
        }

        // ── Create Company + First Admin ──────────────────────
        public async Task<(bool ok, string msg, AuthResponseDto? data)> CreateCompanyAsync(CreateCompanyDto dto)
        {
            if (await _db.Users.IgnoreQueryFilters()
                    .AnyAsync(u => u.Email == dto.AdminEmail.ToLower().Trim()))
                return (false, "This email is already registered.", null);

            // Company-level invite code (legacy/unused now — only branch codes matter)
            string companyCode;
            do { companyCode = GenerateCode(); }
            while (await _db.Companies.AnyAsync(c => c.InviteCode == companyCode));

            var company = new Company
            {
                Name       = dto.CompanyName.Trim(),
                Address    = dto.Address?.Trim(),
                Phone      = dto.Phone?.Trim(),
                InviteCode = companyCode,
                IsActive   = true,
            };
            _db.Companies.Add(company);
            await _db.SaveChangesAsync();

            var admin = new User
            {
                CompanyId    = company.Id,
                BranchId     = null,           // Admin → no branch restriction
                Name         = dto.AdminName.Trim(),
                Email        = dto.AdminEmail.ToLower().Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.AdminPassword),
                Role         = "Admin",
            };
            _db.Users.Add(admin);
            await _db.SaveChangesAsync();

            return (true, "Company created.", new AuthResponseDto
            {
                Token       = GenerateJwt(admin, company, null),
                Name        = admin.Name,
                Role        = admin.Role,
                CompanyId   = company.Id,
                CompanyName = company.Name,
                BranchId    = null,
                BranchName  = null,
            });
        }

        // ── Register Cashier via BRANCH invite code ───────────
        // The cashier is locked to exactly one branch.
        public async Task<(bool ok, string msg)> RegisterAsync(RegisterDto dto)
        {
            var code = dto.InviteCode.ToUpper().Trim();

            // Find branch by invite code — must belong to an active company
            var branch = await _db.Branches
                .Include(b => b.Company)
                .FirstOrDefaultAsync(b => b.InviteCode == code
                                       && !b.IsDeleted
                                       && b.Company!.IsActive
                                       && !b.Company.IsDeleted);

            if (branch == null)
                return (false, "Invalid invite code. Ask your Admin for a branch invite code.");

            if (await _db.Users.IgnoreQueryFilters()
                    .AnyAsync(u => u.Email == dto.Email.ToLower().Trim()))
                return (false, "This email is already registered.");

            var user = new User
            {
                CompanyId    = branch.CompanyId,
                BranchId     = branch.Id,      // ← locked to this branch
                Name         = dto.Name.Trim(),
                Email        = dto.Email.ToLower().Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role         = "Cashier",
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            return (true, "Registered successfully. You can now login.");
        }

        // ── Login ─────────────────────────────────────────────
        public async Task<(bool ok, string msg, AuthResponseDto? data)> LoginAsync(LoginDto dto)
        {
            var user = await _db.Users
                .Include(u => u.Company)
                .Include(u => u.Branch)
                .IgnoreQueryFilters()
                .Where(u => !u.IsDeleted && u.Email == dto.Email.ToLower().Trim())
                .FirstOrDefaultAsync();

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return (false, "Invalid email or password.", null);

            if (user.Company == null || !user.Company.IsActive || user.Company.IsDeleted)
                return (false, "Company account is inactive. Contact support.", null);

            return (true, "Login successful.", new AuthResponseDto
            {
                Token       = GenerateJwt(user, user.Company, user.Branch),
                Name        = user.Name,
                Role        = user.Role,
                CompanyId   = user.CompanyId,
                CompanyName = user.Company.Name,
                BranchId    = user.BranchId,
                BranchName  = user.Branch?.Name,
            });
        }

        // ── JWT — branchId included for cashiers ──────────────
        private string GenerateJwt(User user, Company company, Branch? branch)
        {
            var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Email,          user.Email),
                new(ClaimTypes.Name,           user.Name),
                new(ClaimTypes.Role,           user.Role),
                new("companyId",               company.Id.ToString()),
                new("companyName",             company.Name),
            };

            // Only add branchId for cashiers — admins get no branch restriction
            if (branch != null)
            {
                claims.Add(new Claim("branchId",   branch.Id.ToString()));
                claims.Add(new Claim("branchName", branch.Name));
            }

            var token = new JwtSecurityToken(
                issuer:             _config["Jwt:Issuer"],
                audience:           _config["Jwt:Audience"],
                claims:             claims,
                expires:            DateTime.UtcNow.AddDays(7),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string GenerateCode()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            var rng = new Random();
            return new string(Enumerable.Range(0, 6)
                .Select(_ => chars[rng.Next(chars.Length)]).ToArray());
        }
    }
}