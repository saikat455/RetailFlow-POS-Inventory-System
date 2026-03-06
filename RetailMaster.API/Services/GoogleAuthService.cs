using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using POSSystem.Data;
using POSSystem.DTOs;
using POSSystem.Models;

namespace POSSystem.Services
{
    public class GoogleAuthService
    {
        private readonly AppDbContext   _db;
        private readonly IConfiguration _config;

        public GoogleAuthService(AppDbContext db, IConfiguration config)
        {
            _db = db; _config = config;
        }

        /// <summary>
        /// Main entry point.
        ///
        /// Logic:
        ///   1. Verify the Google id_token (throws if invalid/expired)
        ///   2. Find user by email
        ///      a. Found & active → log them in
        ///      b. Not found, no invite code → tell FE they need a code (NeedsInviteCode=true)
        ///      c. Not found, has invite code → register as cashier in that branch
        ///   3. Return JWT + user info
        /// </summary>
        public async Task<(bool ok, string msg, GoogleAuthResponseDto? data)> HandleAsync(GoogleLoginDto dto)
        {
            // ── Step 1: Verify Google token ───────────────────
            GoogleJsonWebSignature.Payload payload;
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { _config["Google:ClientId"] }
                };
                payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);
            }
            catch (InvalidJwtException ex)
            {
                return (false, $"Invalid Google token: {ex.Message}", null);
            }

            var email = payload.Email.ToLower().Trim();
            var name  = payload.Name ?? payload.Email.Split('@')[0];

            // ── Step 2a: Existing user → log in ──────────────
            var existingUser = await _db.Users
                .Include(u => u.Company)
                .Include(u => u.Branch)
                .FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);

            if (existingUser != null)
            {
                if (existingUser.Company == null || !existingUser.Company.IsActive || existingUser.Company.IsDeleted)
                    return (false, "Company account is inactive. Contact support.", null);

                return (true, "Login successful.", new GoogleAuthResponseDto
                {
                    Token       = GenerateJwt(existingUser, existingUser.Company, existingUser.Branch),
                    Name        = existingUser.Name,
                    Email       = existingUser.Email,
                    Role        = existingUser.Role,
                    CompanyId   = existingUser.CompanyId,
                    CompanyName = existingUser.Company.Name,
                    BranchId    = existingUser.BranchId,
                    BranchName  = existingUser.Branch?.Name,
                    IsNewUser   = false,
                    NeedsInviteCode = false,
                });
            }

            // ── Step 2b: New user, no invite code → ask for it ─
            if (string.IsNullOrWhiteSpace(dto.InviteCode))
            {
                return (true, "New user — please enter your branch invite code.", new GoogleAuthResponseDto
                {
                    Email           = email,
                    Name            = name,
                    NeedsInviteCode = true,
                    IsNewUser       = true,
                    Token           = string.Empty,
                    Role            = string.Empty,
                    CompanyName     = string.Empty,
                });
            }

            // ── Step 2c: New user + invite code → register ────
            var code   = dto.InviteCode.ToUpper().Trim();
            var branch = await _db.Branches
                .Include(b => b.Company)
                .FirstOrDefaultAsync(b => b.InviteCode == code
                                       && !b.IsDeleted
                                       && b.Company!.IsActive
                                       && !b.Company.IsDeleted);

            if (branch == null)
                return (false, "Invalid invite code. Ask your Admin for your branch code.", null);

            // Paranoia — double-check email isn't taken
            if (await _db.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == email))
                return (false, "This email is already registered.", null);

            var newUser = new User
            {
                CompanyId    = branch.CompanyId,
                BranchId     = branch.Id,
                Name         = name.Trim(),
                Email        = email,
                PasswordHash = string.Empty, // Google users have no password
                Role         = "Cashier",
            };
            _db.Users.Add(newUser);
            await _db.SaveChangesAsync();

            return (true, "Account created via Google.", new GoogleAuthResponseDto
            {
                Token       = GenerateJwt(newUser, branch.Company!, branch),
                Name        = newUser.Name,
                Email       = newUser.Email,
                Role        = newUser.Role,
                CompanyId   = branch.CompanyId,
                CompanyName = branch.Company!.Name,
                BranchId    = branch.Id,
                BranchName  = branch.Name,
                IsNewUser   = true,
                NeedsInviteCode = false,
            });
        }

        // ── JWT generation (same as AuthService) ─────────────
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
    }
}
