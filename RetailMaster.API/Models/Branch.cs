namespace POSSystem.Models
{
    public class Branch : BaseEntity
    {
        public string  Name       { get; set; } = string.Empty;
        public string? Address    { get; set; }
        public string? Phone      { get; set; }
        public bool    IsDefault  { get; set; } = false;

        // Branch-level invite code — Admin shares per-branch
        // Cashier registers with this → locked to this branch only
        public string  InviteCode { get; set; } = string.Empty;

        public List<User> Users { get; set; } = new();
        public List<Sale> Sales { get; set; } = new();
    }
}