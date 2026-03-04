namespace POSSystem.DTOs
{
    public class BranchCreateDto
    {
        public string  Name      { get; set; } = string.Empty;
        public string? Address   { get; set; }
        public string? Phone     { get; set; }
        public bool    IsDefault { get; set; } = false;
    }

    public class BranchUpdateDto
    {
        public string  Name      { get; set; } = string.Empty;
        public string? Address   { get; set; }
        public string? Phone     { get; set; }
        public bool    IsDefault { get; set; }
    }

    // Full response — returned to Admin only (includes InviteCode)
    public class BranchResponseDto
    {
        public int      Id         { get; set; }
        public string   Name       { get; set; } = string.Empty;
        public string?  Address    { get; set; }
        public string?  Phone      { get; set; }
        public bool     IsDefault  { get; set; }
        public string   InviteCode { get; set; } = string.Empty;
        public int      SaleCount  { get; set; }
        public int      UserCount  { get; set; }
        public DateTime CreatedAt  { get; set; }
    }

    // Public — returned to Register page (no InviteCode exposed)
    public class BranchPublicDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string BranchName  { get; set; } = string.Empty;
    }
}