using Microsoft.EntityFrameworkCore;
using POSSystem.Data;
using POSSystem.DTOs;
using POSSystem.Models;

namespace POSSystem.Services
{
    public class ProductService
    {
        private readonly AppDbContext _db;

        public ProductService(AppDbContext db) => _db = db;

        // Always filter out soft-deleted products
        private IQueryable<Product> ActiveProducts => _db.Products.Where(p => !p.IsDeleted);

        public async Task<List<ProductResponseDto>> GetAllAsync(string? search)
        {
            var query = ActiveProducts;

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(p =>
                    p.Name.ToLower().Contains(search.ToLower()) ||
                    (p.Barcode != null && p.Barcode.Contains(search)));

            return await query
                .OrderBy(p => p.Name)
                .Select(p => ToDto(p))
                .ToListAsync();
        }

        public async Task<ProductResponseDto?> GetByIdAsync(int id)
        {
            var p = await ActiveProducts.FirstOrDefaultAsync(x => x.Id == id);
            return p == null ? null : ToDto(p);
        }

        public async Task<ProductResponseDto?> GetByBarcodeAsync(string barcode)
        {
            var p = await ActiveProducts.FirstOrDefaultAsync(x => x.Barcode == barcode);
            return p == null ? null : ToDto(p);
        }

        public async Task<(bool success, string message, ProductResponseDto? data)> CreateAsync(ProductCreateDto dto)
        {
            if (dto.SellingPrice <= 0 || dto.PurchasePrice <= 0)
                return (false, "Prices must be greater than 0.", null);

            if (!string.IsNullOrWhiteSpace(dto.Barcode) &&
                await ActiveProducts.AnyAsync(p => p.Barcode == dto.Barcode))
                return (false, "A product with this barcode already exists.", null);

            var product = new Product
            {
                Name = dto.Name.Trim(),
                Barcode = dto.Barcode?.Trim(),
                PurchasePrice = dto.PurchasePrice,
                SellingPrice = dto.SellingPrice,
                StockQty = dto.StockQty,
                LowStockThreshold = dto.LowStockThreshold,
                IsDeleted = false,
            };

            _db.Products.Add(product);
            await _db.SaveChangesAsync();
            return (true, "Product created.", ToDto(product));
        }

        public async Task<(bool success, string message)> UpdateAsync(int id, ProductUpdateDto dto)
        {
            var product = await ActiveProducts.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null) return (false, "Product not found.");

            if (!string.IsNullOrWhiteSpace(dto.Barcode) && dto.Barcode != product.Barcode)
                if (await ActiveProducts.AnyAsync(p => p.Barcode == dto.Barcode && p.Id != id))
                    return (false, "Another product with this barcode already exists.");

            product.Name = dto.Name.Trim();
            product.Barcode = dto.Barcode?.Trim();
            product.PurchasePrice = dto.PurchasePrice;
            product.SellingPrice = dto.SellingPrice;
            product.StockQty = dto.StockQty;
            product.LowStockThreshold = dto.LowStockThreshold;

            await _db.SaveChangesAsync();
            return (true, "Product updated.");
        }

        // SOFT DELETE — just sets IsDeleted = true, record stays in DB
        public async Task<(bool success, string message)> DeleteAsync(int id)
        {
            var product = await ActiveProducts.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null) return (false, "Product not found.");

            product.IsDeleted = true;
            await _db.SaveChangesAsync();
            return (true, "Product deleted.");
        }

        private static ProductResponseDto ToDto(Product p) => new()
        {
            Id = p.Id,
            Name = p.Name,
            Barcode = p.Barcode,
            PurchasePrice = p.PurchasePrice,
            SellingPrice = p.SellingPrice,
            StockQty = p.StockQty,
            LowStockThreshold = p.LowStockThreshold,
            IsLowStock = p.StockQty <= p.LowStockThreshold,
            CreatedDate = p.CreatedDate,
        };
    }
}