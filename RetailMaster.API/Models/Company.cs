namespace POSSystem.Models
{
    /// <summary>
    /// Represents a business/tenant. Each company is isolated — 
    /// users, products, and sales never cross company boundaries.
    /// </summary>
    public class Company
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string InviteCode { get; set; } = string.Empty; // e.g. "ABC123" — cashiers use this to join
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public List<User> Users { get; set; } = new();
    }
}