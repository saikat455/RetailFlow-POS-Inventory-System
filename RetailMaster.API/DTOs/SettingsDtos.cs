namespace POSSystem.DTOs
{
    // ── Update own profile ────────────────────────────────────
    public class UpdateProfileDto
    {
        public string  Name            { get; set; } = string.Empty;
        public string? CurrentPassword { get; set; }  // required only if changing password
        public string? NewPassword     { get; set; }
    }

    // ── Admin updates company info ────────────────────────────
    public class UpdateCompanyDto
    {
        public string  Name    { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Phone   { get; set; }
    }

    // ── Response for /api/settings/me ────────────────────────
    public class ProfileDto
    {
        public int     Id          { get; set; }
        public string  Name        { get; set; } = string.Empty;
        public string  Email       { get; set; } = string.Empty;
        public string  Role        { get; set; } = string.Empty;
        public int?    BranchId    { get; set; }
        public string? BranchName  { get; set; }
        public string  CompanyName { get; set; } = string.Empty;
        public DateTime JoinedAt   { get; set; }
    }

    // ── Response for /api/settings/company ───────────────────
    public class CompanyDetailDto
    {
        public int     Id         { get; set; }
        public string  Name       { get; set; } = string.Empty;
        public string? Address    { get; set; }
        public string? Phone      { get; set; }
        public string  InviteCode { get; set; } = string.Empty;
        public int     UserCount  { get; set; }
        public int     BranchCount { get; set; }
        public DateTime CreatedAt  { get; set; }
    }
}
