using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using POSSystem.Data;
using POSSystem.DTOs;
using POSSystem.Models;
using System.Security.Cryptography;
using System.Text;

namespace POSSystem.Services
{
    public class PasswordResetService
    {
        private readonly AppDbContext _db;
        private readonly IEmailService _email;
        private readonly IConfiguration _config;
        private readonly ILogger<PasswordResetService> _logger;

        public PasswordResetService(
            AppDbContext db, 
            IEmailService email, 
            IConfiguration config,
            ILogger<PasswordResetService> logger)
        {
            _db = db;
            _email = email;
            _config = config;
            _logger = logger;
        }

        /// <summary>
        /// Generate a secure random token
        /// </summary>
        private string GenerateToken()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[32];
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes)
                .Replace("/", "_")
                .Replace("+", "-")
                .Replace("=", "");
        }

        /// <summary>
        /// Request password reset - sends email with reset link
        /// </summary>
        public async Task<(bool success, string message)> ForgotPasswordAsync(ForgotPasswordRequestDto dto)
        {
            var email = dto.Email.ToLower().Trim();
            
            // Find user (ignore soft delete to allow resetting for deleted accounts?)
            var user = await _db.Users
                .Include(u => u.Company)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email == email);

            // Don't reveal if user exists or not (security best practice)
            if (user == null || user.IsDeleted || user.Company?.IsDeleted == true)
            {
                _logger.LogInformation("Password reset requested for non-existent or inactive email: {Email}", email);
                return (true, "If your email exists in our system, you'll receive a reset link.");
            }

            
// Check if company is active
if (user.Company != null && (!user.Company.IsActive || user.Company.IsDeleted))
{
    return (false, "Your company account is inactive. Please contact support.");
}

// Delete any existing unused tokens for this user
var existingTokens = await _db.PasswordResets
    .Where(pr => pr.UserId == user.Id && !pr.IsUsed && pr.ExpiresAt > DateTime.UtcNow)
    .ToListAsync();
            
            if (existingTokens.Any())  // Add this null check
{
    _db.PasswordResets.RemoveRange(existingTokens);
    await _db.SaveChangesAsync();
}

            // Create new token
            var token = GenerateToken();
            var reset = new PasswordReset
            {
                UserId = user.Id,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(1) // Token valid for 1 hour
            };

            _db.PasswordResets.Add(reset);
            await _db.SaveChangesAsync();

            // Build reset link
            var frontendUrl = _config["Frontend:Url"] ?? "http://localhost:5173";
            var resetLink = $"{frontendUrl}/reset-password?token={token}";

            // Send email
            try
            {
                await _email.SendPasswordResetEmailAsync(user.Email, user.Name, resetLink);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email}", user.Email);
                // Still return success to avoid email enumeration
            }

            return (true, "If your email exists in our system, you'll receive a reset link.");
        }

        /// <summary>
        /// Validate reset token
        /// </summary>
        public async Task<(bool valid, string message)> ValidateTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return (false, "Token is required.");

            var reset = await _db.PasswordResets
                .Include(pr => pr.User)
                .ThenInclude(u => u.Company)
                .FirstOrDefaultAsync(pr => pr.Token == token);

            if (reset == null)
                return (false, "Invalid or expired reset token.");

            if (reset.IsUsed)
                return (false, "This reset link has already been used.");

            if (reset.ExpiresAt < DateTime.UtcNow)
                return (false, "This reset link has expired.");

            if (reset.User == null || reset.User.IsDeleted)
                return (false, "User account not found.");

            if (reset.User.Company != null && (!reset.User.Company.IsActive || reset.User.Company.IsDeleted))
                return (false, "Your company account is inactive.");

            return (true, "Token is valid.");
        }

        /// <summary>
        /// Reset password using token
        /// </summary>
        public async Task<(bool success, string message)> ResetPasswordAsync(ResetPasswordDto dto)
        {
            if (dto.NewPassword != dto.ConfirmPassword)
                return (false, "Passwords do not match.");

            if (dto.NewPassword.Length < 6)
                return (false, "Password must be at least 6 characters.");

            var reset = await _db.PasswordResets
                .Include(pr => pr.User)
                .FirstOrDefaultAsync(pr => pr.Token == dto.Token);

            if (reset == null)
                return (false, "Invalid or expired reset token.");

            if (reset.IsUsed)
                return (false, "This reset link has already been used.");

            if (reset.ExpiresAt < DateTime.UtcNow)
                return (false, "This reset link has expired.");

            if (reset.User == null || reset.User.IsDeleted)
                return (false, "User account not found.");

            // Update password
            reset.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            reset.User.UpdatedAt = DateTime.UtcNow;
            
            // Mark token as used
            reset.IsUsed = true;

            await _db.SaveChangesAsync();

            _logger.LogInformation("Password reset successful for user: {Email}", reset.User.Email);

            return (true, "Password reset successful. You can now log in with your new password.");
        }
    }
}