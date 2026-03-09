namespace POSSystem.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string email, string name, string resetLink);
    }
}