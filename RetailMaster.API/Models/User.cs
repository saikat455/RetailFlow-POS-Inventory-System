namespace POSSystem.Models
{
    public class User
    {
        public int      Id           { get; set; }
        public int      CompanyId    { get; set; }
        public Company? Company      { get; set; }

        // null  → Admin (sees all branches in company)
        // value → Cashier (locked to this branch only, cannot see other branches)
        public int?    BranchId     { get; set; }
        public Branch? Branch       { get; set; }

        public string  Name         { get; set; } = string.Empty;
        public string  Email        { get; set; } = string.Empty;
        public string  PasswordHash { get; set; } = string.Empty;
        public string  Role         { get; set; } = "Cashier"; // Admin | Cashier
        public bool    IsDeleted    { get; set; } = false;
        public DateTime CreatedAt   { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt   { get; set; } = DateTime.UtcNow;
    }
}