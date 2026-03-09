using System.Net;
using System.Net.Mail;

namespace POSSystem.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string email, string name, string resetLink)
        {
            try
            {
                var smtpHost = _config["Email:SmtpHost"];
                var smtpPort = int.Parse(_config["Email:SmtpPort"] ?? "587");
                var smtpUser = _config["Email:SmtpUser"];
                var smtpPass = _config["Email:SmtpPass"];
                var fromEmail = _config["Email:FromEmail"] ?? "noreply@pospro.com";
                var fromName = _config["Email:FromName"] ?? "POSPro";

                if (string.IsNullOrEmpty(smtpHost))
                {
                    // Fallback to logging if not configured
                    _logger.LogWarning("Email settings not configured. Reset link: {ResetLink}", resetLink);
                    return;
                }

                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    EnableSsl = true,
                    Credentials = new NetworkCredential(smtpUser, smtpPass)
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
                    Subject = "Reset Your POSPro Password",
                    Body = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                            <div style='background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                                <h1 style='color: white; margin: 0; font-size: 24px;'>POSPro</h1>
                            </div>
                            <div style='background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;'>
                                <h2 style='color: #1f2937; margin-top: 0;'>Hello {name},</h2>
                                <p style='color: #4b5563; line-height: 1.6;'>We received a request to reset your password. Click the button below to create a new password:</p>
                                <div style='text-align: center; margin: 30px 0;'>
                                    <a href='{resetLink}' 
                                       style='background: #3b82f6; color: white; padding: 12px 30px; 
                                              text-decoration: none; border-radius: 8px; font-weight: bold;
                                              display: inline-block;'>
                                        Reset Password
                                    </a>
                                </div>
                                <p style='color: #4b5563; line-height: 1.6;'>Or copy this link to your browser:</p>
                                <p style='background: #f3f4f6; padding: 10px; border-radius: 5px; 
                                          word-break: break-all; font-family: monospace;'>
                                    {resetLink}
                                </p>
                                <p style='color: #4b5563; line-height: 1.6; margin-top: 30px;'>
                                    This link will expire in 1 hour. If you didn't request this, please ignore this email.
                                </p>
                                <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;' />
                                <p style='color: #9ca3af; font-size: 12px; text-align: center;'>
                                    &copy; {DateTime.UtcNow.Year} POSPro. All rights reserved.
                                </p>
                            </div>
                        </html>
                    ",
                    IsBodyHtml = true
                };

                mailMessage.To.Add(email);
                await client.SendMailAsync(mailMessage);
                
                _logger.LogInformation("Password reset email sent to {Email}", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email}", email);
                throw;
            }
        }
    }
}