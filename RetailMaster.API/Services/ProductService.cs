using Microsoft.EntityFrameworkCore;
using POSSystem.Data;
using POSSystem.DTOs;
using POSSystem.Models;

namespace POSSystem.Services
{
    public class ProductService
    {
        private readonly AppDbContext           _db;
        private readonly ICurrentCompanyService _ctx;

        public ProductService(AppDbContext db, ICurrentCompanyService ctx)
        {
            _db = db; _ctx = ctx;
        }

        private IQueryable<Product> ScopedProducts =>
            _db.Products.Where(p => p.CompanyId == _ctx.CompanyId && !p.IsDeleted);

        // ── GET: products for a specific branch ───────────────
        // Cashier calls this — only sees products assigned to their branch
        // with their branch's stock qty
        public async Task<List<ProductResponseDto>> GetForBranchAsync(int branchId, string? search = null)
        {
            var companyId = _ctx.CompanyId;

            // Cashier can only query their own branch
            if (!_ctx.IsAdmin && _ctx.BranchId.HasValue && _ctx.BranchId != branchId)
                return new();

            var query = _db.BranchProducts
                .Include(bp => bp.Product)
                .Where(bp => bp.CompanyId == companyId
                          && bp.BranchId  == branchId
                          && !bp.IsDeleted
                          && !bp.Product!.IsDeleted);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                query = query.Where(bp =>
                    bp.Product!.Name.ToLower().Contains(q) ||
                    (bp.Product.Barcode != null && bp.Product.Barcode.Contains(search)));
            }

            return await query.OrderBy(bp => bp.Product!.Name)
                .Select(bp => new ProductResponseDto
                {
                    Id                = bp.Product!.Id,
                    Name              = bp.Product.Name,
                    Barcode           = bp.Product.Barcode,
                    PurchasePrice     = bp.Product.PurchasePrice,
                    SellingPrice      = bp.Product.SellingPrice,
                    StockQty          = bp.StockQty,
                    LowStockThreshold = bp.LowStockThreshold,
                    IsLowStock        = bp.StockQty <= bp.LowStockThreshold,
                    CreatedDate       = bp.Product.CreatedAt,
                })
                .ToListAsync();
        }

        // ── GET: full catalogue (Admin) with per-branch stocks ─
        public async Task<List<ProductCatalogueDto>> GetCatalogueAsync(string? search = null)
        {
            var companyId = _ctx.CompanyId;
            var q = ScopedProducts;

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lower = search.ToLower();
                q = q.Where(p => p.Name.ToLower().Contains(lower) ||
                                 (p.Barcode != null && p.Barcode.Contains(search)));
            }

            var products = await q
                .Include(p => p.BranchStocks.Where(bp => !bp.IsDeleted))
                    .ThenInclude(bp => bp.Branch)
                .OrderBy(p => p.Name)
                .ToListAsync();

            return products.Select(p => new ProductCatalogueDto
            {
                Id            = p.Id,
                Name          = p.Name,
                Barcode       = p.Barcode,
                PurchasePrice = p.PurchasePrice,
                SellingPrice  = p.SellingPrice,
                CreatedDate   = p.CreatedAt,
                TotalBranches = p.BranchStocks.Count,
                BranchStocks  = p.BranchStocks.Select(bp => new BranchStockDto
                {
                    BranchId          = bp.BranchId,
                    BranchName        = bp.Branch?.Name ?? string.Empty,
                    StockQty          = bp.StockQty,
                    LowStockThreshold = bp.LowStockThreshold,
                    IsLowStock        = bp.StockQty <= bp.LowStockThreshold,
                }).ToList(),
            }).ToList();
        }

        // ── GET by barcode for a branch (POS scan) ────────────
        public async Task<ProductResponseDto?> GetByBarcodeForBranchAsync(string barcode, int branchId)
        {
            var bp = await _db.BranchProducts
                .Include(x => x.Product)
                .Where(x => x.CompanyId  == _ctx.CompanyId
                         && x.BranchId   == branchId
                         && !x.IsDeleted
                         && !x.Product!.IsDeleted
                         && x.Product.Barcode == barcode)
                .FirstOrDefaultAsync();

            if (bp == null) return null;
            return new ProductResponseDto
            {
                Id = bp.Product!.Id, Name = bp.Product.Name,
                Barcode = bp.Product.Barcode, PurchasePrice = bp.Product.PurchasePrice,
                SellingPrice = bp.Product.SellingPrice, StockQty = bp.StockQty,
                LowStockThreshold = bp.LowStockThreshold,
                IsLowStock = bp.StockQty <= bp.LowStockThreshold,
                CreatedDate = bp.Product.CreatedAt,
            };
        }

        // ── CREATE: add to catalogue (Admin only) ─────────────
        // Does NOT add stock — call AssignStock per branch after
        public async Task<(bool ok, string msg, ProductCatalogueDto? data)> CreateAsync(ProductCreateDto dto)
        {
            if (!_ctx.IsAdmin) return (false, "Admins only.", null);
            var companyId = _ctx.CompanyId;

            if (!string.IsNullOrWhiteSpace(dto.Barcode) &&
                await _db.Products.AnyAsync(p => p.CompanyId == companyId && !p.IsDeleted && p.Barcode == dto.Barcode))
                return (false, "A product with this barcode already exists.", null);

            var product = new Product
            {
                CompanyId     = companyId,
                Name          = dto.Name.Trim(),
                Barcode       = dto.Barcode?.Trim(),
                PurchasePrice = dto.PurchasePrice,
                SellingPrice  = dto.SellingPrice,
            };
            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            return (true, "Product added to catalogue.", new ProductCatalogueDto
            {
                Id = product.Id, Name = product.Name, Barcode = product.Barcode,
                PurchasePrice = product.PurchasePrice, SellingPrice = product.SellingPrice,
                CreatedDate = product.CreatedAt, TotalBranches = 0,
            });
        }

        // ── UPDATE: edit catalogue info (Admin only) ──────────
        public async Task<(bool ok, string msg)> UpdateAsync(int id, ProductUpdateDto dto)
        {
            if (!_ctx.IsAdmin) return (false, "Admins only.");
            var companyId = _ctx.CompanyId;

            var product = await _db.Products
                .FirstOrDefaultAsync(p => p.Id == id && p.CompanyId == companyId && !p.IsDeleted);
            if (product == null) return (false, "Product not found.");

            if (!string.IsNullOrWhiteSpace(dto.Barcode) && dto.Barcode != product.Barcode &&
                await _db.Products.AnyAsync(p => p.CompanyId == companyId && !p.IsDeleted &&
                    p.Barcode == dto.Barcode && p.Id != id))
                return (false, "Another product with this barcode already exists.");

            product.Name = dto.Name.Trim(); product.Barcode = dto.Barcode?.Trim();
            product.PurchasePrice = dto.PurchasePrice; product.SellingPrice = dto.SellingPrice;
            product.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Product updated.");
        }

        // ── ASSIGN STOCK: add product to a branch ─────────────
        // Creates BranchProduct row (or restores soft-deleted one)
        public async Task<(bool ok, string msg)> AssignStockAsync(AssignStockDto dto)
        {
            if (!_ctx.IsAdmin) return (false, "Admins only.");
            var companyId = _ctx.CompanyId;

            var product = await _db.Products
                .FirstOrDefaultAsync(p => p.Id == dto.ProductId && p.CompanyId == companyId && !p.IsDeleted);
            if (product == null) return (false, "Product not found.");

            var branch = await _db.Branches
                .FirstOrDefaultAsync(b => b.Id == dto.BranchId && b.CompanyId == companyId && !b.IsDeleted);
            if (branch == null) return (false, "Branch not found.");

            // Check existing (including soft-deleted)
            var existing = await _db.BranchProducts.IgnoreQueryFilters()
                .FirstOrDefaultAsync(bp => bp.BranchId == dto.BranchId && bp.ProductId == dto.ProductId);

            if (existing != null)
            {
                existing.IsDeleted = false;
                existing.StockQty  = dto.StockQty;
                existing.LowStockThreshold = dto.LowStockThreshold;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _db.BranchProducts.Add(new BranchProduct
                {
                    CompanyId = companyId, BranchId = dto.BranchId, ProductId = dto.ProductId,
                    StockQty = dto.StockQty, LowStockThreshold = dto.LowStockThreshold,
                });
            }

            await _db.SaveChangesAsync();
            return (true, $"{dto.StockQty} units of '{product.Name}' assigned to {branch.Name}.");
        }

        // ── ADJUST STOCK: update qty for a branch ─────────────
        public async Task<(bool ok, string msg)> AdjustStockAsync(int productId, int branchId, AdjustStockDto dto)
        {
            if (!_ctx.IsAdmin) return (false, "Admins only.");

            var bp = await _db.BranchProducts
                .FirstOrDefaultAsync(x => x.ProductId == productId && x.BranchId == branchId
                                       && x.CompanyId == _ctx.CompanyId && !x.IsDeleted);
            if (bp == null) return (false, "Stock record not found for this branch.");

            bp.StockQty = dto.StockQty; bp.LowStockThreshold = dto.LowStockThreshold;
            bp.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Stock updated.");
        }

        // ── REMOVE from branch (soft delete BranchProduct row) ─
        public async Task<(bool ok, string msg)> RemoveFromBranchAsync(int productId, int branchId)
        {
            if (!_ctx.IsAdmin) return (false, "Admins only.");

            var bp = await _db.BranchProducts
                .FirstOrDefaultAsync(x => x.ProductId == productId && x.BranchId == branchId
                                       && x.CompanyId == _ctx.CompanyId && !x.IsDeleted);
            if (bp == null) return (false, "Product not assigned to this branch.");

            bp.IsDeleted = true; bp.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Product removed from branch.");
        }

        // ── DELETE from catalogue (removes from all branches) ──
        public async Task<(bool ok, string msg)> DeleteAsync(int id)
        {
            if (!_ctx.IsAdmin) return (false, "Admins only.");
            var companyId = _ctx.CompanyId;

            var product = await _db.Products
                .FirstOrDefaultAsync(p => p.Id == id && p.CompanyId == companyId && !p.IsDeleted);
            if (product == null) return (false, "Product not found.");

            var stocks = await _db.BranchProducts
                .Where(bp => bp.ProductId == id && bp.CompanyId == companyId && !bp.IsDeleted)
                .ToListAsync();
            foreach (var bp in stocks) { bp.IsDeleted = true; bp.UpdatedAt = DateTime.UtcNow; }

            product.IsDeleted = true; product.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Product deleted from catalogue and all branches.");
        }
    }
}