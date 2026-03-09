using Microsoft.EntityFrameworkCore;
using POSSystem.Models;

namespace POSSystem.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Company>       Companies      => Set<Company>();
        public DbSet<Branch>        Branches       => Set<Branch>();
        public DbSet<User>          Users          => Set<User>();
        public DbSet<Product>       Products       => Set<Product>();
        public DbSet<BranchProduct> BranchProducts => Set<BranchProduct>();
        public DbSet<Sale>          Sales          => Set<Sale>();
        public DbSet<SaleItem>      SaleItems      => Set<SaleItem>();
        public DbSet<PasswordReset> PasswordResets => Set<PasswordReset>();

        protected override void OnModelCreating(ModelBuilder mb)
        {
            // ── Company ──────────────────────────────────────
            mb.Entity<Company>()
              .HasIndex(c => c.InviteCode).IsUnique();
            mb.Entity<Company>()
              .HasQueryFilter(c => !c.IsDeleted);

            // ── Branch ───────────────────────────────────────
            mb.Entity<Branch>()
              .HasOne(b => b.Company).WithMany()
              .HasForeignKey(b => b.CompanyId).OnDelete(DeleteBehavior.Restrict);
            mb.Entity<Branch>()
              .HasIndex(b => b.InviteCode).IsUnique();
            mb.Entity<Branch>()
              .HasQueryFilter(b => !b.IsDeleted);

            // ── User ─────────────────────────────────────────
            mb.Entity<User>()
              .HasIndex(u => u.Email).IsUnique();
            mb.Entity<User>()
              .HasOne(u => u.Company).WithMany(c => c.Users)
              .HasForeignKey(u => u.CompanyId).OnDelete(DeleteBehavior.Restrict);
            mb.Entity<User>()
              .HasOne(u => u.Branch).WithMany(b => b.Users)
              .HasForeignKey(u => u.BranchId).OnDelete(DeleteBehavior.SetNull);
            mb.Entity<User>()
              .HasQueryFilter(u => !u.IsDeleted);

            // ── Product (catalogue only, no stock) ───────────
            mb.Entity<Product>()
              .HasOne(p => p.Company).WithMany()
              .HasForeignKey(p => p.CompanyId).OnDelete(DeleteBehavior.Restrict);
            mb.Entity<Product>()
              .HasQueryFilter(p => !p.IsDeleted);

            // ── BranchProduct ─────────────────────────────────
            // Unique: one stock row per (Branch × Product)
            mb.Entity<BranchProduct>()
              .HasIndex(bp => new { bp.BranchId, bp.ProductId }).IsUnique();
            mb.Entity<BranchProduct>()
              .HasOne(bp => bp.Branch).WithMany()
              .HasForeignKey(bp => bp.BranchId).OnDelete(DeleteBehavior.Restrict);
            mb.Entity<BranchProduct>()
              .HasOne(bp => bp.Product).WithMany(p => p.BranchStocks)
              .HasForeignKey(bp => bp.ProductId).OnDelete(DeleteBehavior.Cascade);

            // ── Sale ─────────────────────────────────────────
            mb.Entity<Sale>()
              .HasOne(s => s.Company).WithMany()
              .HasForeignKey(s => s.CompanyId).OnDelete(DeleteBehavior.Restrict);
            mb.Entity<Sale>()
              .HasOne(s => s.Branch).WithMany(b => b.Sales)
              .HasForeignKey(s => s.BranchId).OnDelete(DeleteBehavior.Restrict);
            mb.Entity<Sale>()
              .HasOne(s => s.User).WithMany()
              .HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Restrict);
            mb.Entity<Sale>()
              .HasIndex(s => s.InvoiceNo).IsUnique();
            mb.Entity<Sale>()
              .HasQueryFilter(s => !s.IsDeleted);

            // ── SaleItem ─────────────────────────────────────
            mb.Entity<SaleItem>()
              .HasOne(si => si.Sale).WithMany(s => s.SaleItems)
              .HasForeignKey(si => si.SaleId).OnDelete(DeleteBehavior.Cascade);
            mb.Entity<SaleItem>()
              .HasOne(si => si.Product).WithMany()
              .HasForeignKey(si => si.ProductId).OnDelete(DeleteBehavior.Restrict);
            mb.Entity<SaleItem>()
              .HasQueryFilter(si => !si.IsDeleted);

            // ── PasswordReset ─────────────────────────────────────
            mb.Entity<PasswordReset>()
              .HasOne(pr => pr.User)
              .WithMany()
              .HasForeignKey(pr => pr.UserId)
              .OnDelete(DeleteBehavior.Cascade);
            mb.Entity<PasswordReset>()
              .HasIndex(pr => pr.Token).IsUnique();
            mb.Entity<PasswordReset>()
              .HasQueryFilter(pr => !pr.IsUsed && pr.ExpiresAt > DateTime.UtcNow);
        }
    }
}