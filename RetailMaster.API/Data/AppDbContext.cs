using Microsoft.EntityFrameworkCore;
using POSSystem.Models;

namespace POSSystem.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<Sale> Sales => Set<Sale>();
        public DbSet<SaleItem> SaleItems => Set<SaleItem>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Sale>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SaleItem>()
                .HasOne(si => si.Sale)
                .WithMany(s => s.SaleItems)
                .HasForeignKey(si => si.SaleId);

            modelBuilder.Entity<SaleItem>()
                .HasOne(si => si.Product)
                .WithMany()
                .HasForeignKey(si => si.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seed some sample products for demo
            modelBuilder.Entity<Product>().HasData(
                new Product { Id = 1, Name = "Coca Cola 1L", Barcode = "5000112637922", PurchasePrice = 25, SellingPrice = 40, StockQty = 3, LowStockThreshold = 5, CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Product { Id = 2, Name = "Lays Chips Classic", Barcode = "0028400047685", PurchasePrice = 15, SellingPrice = 25, StockQty = 20, LowStockThreshold = 5, CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Product { Id = 3, Name = "Mineral Water 500ml", Barcode = "8901234567890", PurchasePrice = 8, SellingPrice = 15, StockQty = 4, LowStockThreshold = 10, CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Product { Id = 4, Name = "Bread Loaf", Barcode = "1234567890123", PurchasePrice = 30, SellingPrice = 45, StockQty = 8, LowStockThreshold = 5, CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Product { Id = 5, Name = "Milk 1L Tetra", Barcode = "9876543210987", PurchasePrice = 55, SellingPrice = 75, StockQty = 2, LowStockThreshold = 5, CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        }
    }
}