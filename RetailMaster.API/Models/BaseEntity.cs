namespace POSSystem.Models
{
    /// <summary>
    /// Base entity inherited by all models.
    /// CompanyId  — mandatory for multi-tenancy (data never crosses companies)
    /// BranchId   — optional, nullable (Company-level records like Products don't
    ///              belong to a branch; only Sales and Users do)
    /// IsDeleted  — soft delete flag
    /// CreatedAt / UpdatedAt — audit timestamps
    /// </summary>
    public abstract class BaseEntity
    {
        public int  Id        { get; set; }
        public int  CompanyId { get; set; }
        public Company? Company { get; set; }

        // Nullable — Products are company-wide; Sales/Users are branch-specific
        public int?    BranchId { get; set; }
        public Branch? Branch   { get; set; }

        public bool     IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}