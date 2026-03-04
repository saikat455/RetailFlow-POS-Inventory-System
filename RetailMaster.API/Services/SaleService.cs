using Microsoft.EntityFrameworkCore;
using POSSystem.Data;
using POSSystem.DTOs;
using POSSystem.Models;

namespace POSSystem.Services
{
    public class SaleService
    {
        private readonly AppDbContext           _db;
        private readonly ICurrentCompanyService _ctx;

        public SaleService(AppDbContext db, ICurrentCompanyService ctx)
        {
            _db = db; _ctx = ctx;
        }

        private IQueryable<Sale> ScopedSales
        {
            get
            {
                var q = _db.Sales.Where(s => s.CompanyId == _ctx.CompanyId && !s.IsDeleted);
                if (!_ctx.IsAdmin && _ctx.BranchId.HasValue)
                    q = q.Where(s => s.BranchId == _ctx.BranchId.Value);
                return q;
            }
        }

        private async Task<string> GenerateInvoiceNoAsync(int companyId)
        {
            var today = DateTime.UtcNow;
            var count = await _db.Sales.IgnoreQueryFilters()
                .CountAsync(s => s.CompanyId == companyId && s.CreatedAt.Date == today.Date);
            return $"INV-{today:yyyyMMdd}-{(count + 1):D5}";
        }

        public async Task<(bool ok, string msg, SaleResponseDto? data)> CreateSaleAsync(CreateSaleDto dto)
        {
            var companyId = _ctx.CompanyId;
            if (dto.Items == null || dto.Items.Count == 0)
                return (false, "Sale must have at least one item.", null);

            var branchId = _ctx.IsAdmin ? dto.BranchId : _ctx.BranchId!.Value;

            var branch = await _db.Branches.Include(b => b.Company)
                .FirstOrDefaultAsync(b => b.Id == branchId && b.CompanyId == companyId && !b.IsDeleted);
            if (branch == null) return (false, "Branch not found.", null);

            var productIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();

            // ── Fetch BranchProduct rows (branch-specific stock) ──
            var branchStocks = await _db.BranchProducts
                .Include(bp => bp.Product)
                .Where(bp => bp.CompanyId == companyId
                          && bp.BranchId  == branchId
                          && !bp.IsDeleted
                          && !bp.Product!.IsDeleted
                          && productIds.Contains(bp.ProductId))
                .ToListAsync();

            // Validate all items
            foreach (var item in dto.Items)
            {
                var bp = branchStocks.FirstOrDefault(x => x.ProductId == item.ProductId);
                if (bp == null)
                    return (false, $"Product ID {item.ProductId} is not available in this branch.", null);
                if (item.Quantity <= 0)
                    return (false, $"Quantity for '{bp.Product!.Name}' must be > 0.", null);
                if (bp.StockQty < item.Quantity)
                    return (false, $"Insufficient stock for '{bp.Product!.Name}'. Available: {bp.StockQty}.", null);
            }

            using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                var invoiceNo = await GenerateInvoiceNoAsync(companyId);
                var saleItems = new List<SaleItem>();
                decimal total = 0;

                foreach (var item in dto.Items)
                {
                    var bp      = branchStocks.First(x => x.ProductId == item.ProductId);
                    var product = bp.Product!;
                    var subtotal = product.SellingPrice * item.Quantity;
                    var profit   = (product.SellingPrice - product.PurchasePrice) * item.Quantity;

                    saleItems.Add(new SaleItem
                    {
                        CompanyId = companyId, BranchId = branchId,
                        ProductId = product.Id, Quantity = item.Quantity,
                        UnitPrice = product.SellingPrice, Profit = profit,
                    });

                    // ← Only deducts THIS branch's stock
                    bp.StockQty  -= item.Quantity;
                    bp.UpdatedAt  = DateTime.UtcNow;
                    total        += subtotal;
                }

                var discount    = Math.Max(0, dto.Discount);
                var finalAmount = Math.Max(0, total - discount);

                var sale = new Sale
                {
                    CompanyId = companyId, BranchId = branchId, UserId = _ctx.UserId,
                    InvoiceNo = invoiceNo, TotalAmount = total,
                    Discount = discount, FinalAmount = finalAmount,
                    CustomerName  = dto.CustomerName?.Trim(),
                    CustomerPhone = dto.CustomerPhone?.Trim(),
                    SaleItems = saleItems,
                };

                _db.Sales.Add(sale);
                await _db.SaveChangesAsync();
                await tx.CommitAsync();

                var cashier = await _db.Users
                    .Where(u => u.Id == _ctx.UserId && u.CompanyId == companyId)
                    .FirstOrDefaultAsync();

                var products = branchStocks.Select(bp => bp.Product!).ToList();
                return (true, "Sale completed.",
                    MapToDto(sale, saleItems, products, cashier?.Name ?? "Unknown", branch, branch.Company!));
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return (false, $"Sale failed: {ex.Message}", null);
            }
        }

        public async Task<List<SaleResponseDto>> GetRecentSalesAsync(int take = 20, int? branchId = null)
        {
            var companyId = _ctx.CompanyId;
            var query = ScopedSales
                .Include(s => s.User)
                .Include(s => s.Branch).ThenInclude(b => b!.Company)
                .Include(s => s.SaleItems.Where(si => si.CompanyId == companyId && !si.IsDeleted))
                    .ThenInclude(si => si.Product)
                .AsQueryable();

            if (_ctx.IsAdmin && branchId.HasValue)
                query = query.Where(s => s.BranchId == branchId.Value);

            var sales = await query.OrderByDescending(s => s.CreatedAt).Take(take).ToListAsync();
            return sales.Select(s => MapFullDto(s, companyId)).ToList();
        }

        public async Task<SaleResponseDto?> GetByIdAsync(int id)
        {
            var companyId = _ctx.CompanyId;
            var sale = await ScopedSales.Where(s => s.Id == id)
                .Include(s => s.User)
                .Include(s => s.Branch).ThenInclude(b => b!.Company)
                .Include(s => s.SaleItems.Where(si => si.CompanyId == companyId && !si.IsDeleted))
                    .ThenInclude(si => si.Product)
                .FirstOrDefaultAsync();
            return sale == null ? null : MapFullDto(sale, companyId);
        }

        public async Task<SaleResponseDto?> GetByInvoiceNoAsync(string invoiceNo)
        {
            var companyId = _ctx.CompanyId;
            var sale = await ScopedSales.Where(s => s.InvoiceNo == invoiceNo)
                .Include(s => s.User)
                .Include(s => s.Branch).ThenInclude(b => b!.Company)
                .Include(s => s.SaleItems.Where(si => si.CompanyId == companyId && !si.IsDeleted))
                    .ThenInclude(si => si.Product)
                .FirstOrDefaultAsync();
            return sale == null ? null : MapFullDto(sale, companyId);
        }

        private static SaleResponseDto MapFullDto(Sale s, int companyId) => new()
        {
            Id = s.Id, InvoiceNo = s.InvoiceNo, SaleDate = s.CreatedAt,
            BranchName = s.Branch?.Name ?? string.Empty, BranchAddress = s.Branch?.Address,
            BranchPhone = s.Branch?.Phone, CompanyName = s.Branch?.Company?.Name ?? string.Empty,
            CompanyAddress = s.Branch?.Company?.Address, CompanyPhone = s.Branch?.Company?.Phone,
            CashierName = s.User?.Name ?? "Unknown", CustomerName = s.CustomerName,
            CustomerPhone = s.CustomerPhone, TotalAmount = s.TotalAmount,
            Discount = s.Discount, FinalAmount = s.FinalAmount,
            TotalProfit = s.SaleItems.Where(si => si.CompanyId == companyId).Sum(si => si.Profit),
            Items = s.SaleItems.Where(si => si.CompanyId == companyId).Select(si => new SaleItemResponseDto
            {
                ProductName = si.Product?.Name ?? "Deleted", Quantity = si.Quantity,
                UnitPrice = si.UnitPrice, Subtotal = si.UnitPrice * si.Quantity, Profit = si.Profit,
            }).ToList()
        };

        private static SaleResponseDto MapToDto(Sale sale, List<SaleItem> items, List<Product> products,
            string cashierName, Branch branch, Company company) => new()
        {
            Id = sale.Id, InvoiceNo = sale.InvoiceNo, SaleDate = sale.CreatedAt,
            BranchName = branch.Name, BranchAddress = branch.Address, BranchPhone = branch.Phone,
            CompanyName = company.Name, CompanyAddress = company.Address, CompanyPhone = company.Phone,
            CashierName = cashierName, CustomerName = sale.CustomerName, CustomerPhone = sale.CustomerPhone,
            TotalAmount = sale.TotalAmount, Discount = sale.Discount, FinalAmount = sale.FinalAmount,
            TotalProfit = items.Sum(i => i.Profit),
            Items = items.Select(si => {
                var p = products.First(x => x.Id == si.ProductId);
                return new SaleItemResponseDto
                {
                    ProductName = p.Name, Quantity = si.Quantity, UnitPrice = si.UnitPrice,
                    Subtotal = si.UnitPrice * si.Quantity, Profit = si.Profit,
                };
            }).ToList()
        };
    }
}