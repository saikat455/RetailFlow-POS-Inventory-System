namespace POSSystem.DTOs
{
    public class CreateCompanyDto
    {
        public string  CompanyName   { get; set; } = string.Empty;
        public string? Address       { get; set; }
        public string? Phone         { get; set; }
        public string  AdminName     { get; set; } = string.Empty;
        public string  AdminEmail    { get; set; } = string.Empty;
        public string  AdminPassword { get; set; } = string.Empty;
    }

    public class CompanyResponseDto
    {
        public int     Id      { get; set; }
        public string  Name    { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Phone   { get; set; }
        public string? InviteCode   { get; set; }
    }

    // Cashier registers with a BRANCH invite code — not a company code.
    // This locks them to exactly one branch.
    public class RegisterDto
    {
        public string Name       { get; set; } = string.Empty;
        public string Email      { get; set; } = string.Empty;
        public string Password   { get; set; } = string.Empty;
        public string InviteCode { get; set; } = string.Empty; // branch-level invite code
    }

    public class LoginDto
    {
        public string Email    { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string  Token       { get; set; } = string.Empty;
        public string  Name        { get; set; } = string.Empty;
        public string  Role        { get; set; } = string.Empty;
        public int     CompanyId   { get; set; }
        public string  CompanyName { get; set; } = string.Empty;
        public int?    BranchId    { get; set; }   // null for Admin
        public string? BranchName  { get; set; }   // null for Admin
    }
}