using Microsoft.EntityFrameworkCore;
using POSSystem.Data;
using POSSystem.DTOs;

namespace POSSystem.Services
{
    public class DashboardService
    {
        private readonly AppDbContext           _db;
        private readonly ICurrentCompanyService _ctx;

        public DashboardService(AppDbContext db, ICurrentCompanyService ctx)
        {
            _db = db; _ctx = ctx;
        }

        public async Task<DashboardDto> GetAsync()
        {
            var companyId = _ctx.CompanyId;
            var today     = DateTime.UtcNow.Date;
            var tomorrow  = today.AddDays(1);

            // Admin sees all branches; Cashier sees only their branch
            int? branchId = _ctx.IsAdmin ? null : _ctx.BranchId;

            // ── Base sales query ──────────────────────────────
            var salesQuery = _db.Sales.Where(s =>
                s.CompanyId == companyId && !s.IsDeleted);

            if (branchId.HasValue)
                salesQuery = salesQuery.Where(s => s.BranchId == branchId.Value);

            // ── Today's sales ─────────────────────────────────
            var todaySales = await salesQuery
                .Where(s => s.CreatedAt >= today && s.CreatedAt < tomorrow)
                .ToListAsync();

            var todayRevenue      = todaySales.Sum(s => s.FinalAmount);
            var todayTransactions = todaySales.Count;

            // ── Today's profit via SaleItems ──────────────────
            var todaySaleIds = todaySales.Select(s => s.Id).ToList();
            var todayProfit  = await _db.SaleItems
                .Where(si => si.CompanyId == companyId
                          && !si.IsDeleted
                          && todaySaleIds.Contains(si.SaleId)
                          && (!branchId.HasValue || si.BranchId == branchId.Value))
                .SumAsync(si => si.Profit);

            // ── Low stock — now reads from BranchProducts ─────
            // Admin: across all branches in company
            // Cashier: only their branch
            var lowStockQuery = _db.BranchProducts
                .Include(bp => bp.Product)
                .Where(bp => bp.CompanyId == companyId
                          && !bp.IsDeleted
                          && !bp.Product!.IsDeleted);

            if (branchId.HasValue)
                lowStockQuery = lowStockQuery.Where(bp => bp.BranchId == branchId.Value);

            var lowStockItems = await lowStockQuery
                .Where(bp => bp.StockQty <= bp.LowStockThreshold)
                .Select(bp => new LowStockItemDto
                {
                    ProductId   = bp.ProductId,
                    ProductName = bp.Product!.Name,
                    BranchName  = bp.Branch != null ? bp.Branch.Name : string.Empty,
                    StockQty    = bp.StockQty,
                    Threshold   = bp.LowStockThreshold,
                })
                .OrderBy(x => x.StockQty)
                .Take(10)
                .ToListAsync();

            // ── Top 5 products (last 30 days) ─────────────────
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var topProductsQuery = _db.SaleItems
                .Include(si => si.Product)
                .Where(si => si.CompanyId == companyId
                          && !si.IsDeleted
                          && si.Sale!.CreatedAt >= thirtyDaysAgo
                          && !si.Sale.IsDeleted);

            if (branchId.HasValue)
                topProductsQuery = topProductsQuery.Where(si => si.BranchId == branchId.Value);

            var topProducts = await topProductsQuery
                .GroupBy(si => new { si.ProductId, si.Product!.Name })
                .Select(g => new TopProductDto
                {
                    ProductName = g.Key.Name,
                    QtySold     = g.Sum(si => si.Quantity),
                    Revenue     = g.Sum(si => si.UnitPrice * si.Quantity),
                })
                .OrderByDescending(p => p.QtySold)
                .Take(5)
                .ToListAsync();

            // ── 7-day trend ───────────────────────────────────
            var sevenDaysAgo = today.AddDays(-6);
            var recentSales  = await salesQuery
                .Where(s => s.CreatedAt >= sevenDaysAgo && s.CreatedAt < tomorrow)
                .ToListAsync();

            var trend = Enumerable.Range(0, 7)
                .Select(i =>
                {
                    var day       = today.AddDays(-6 + i);
                    var daySales  = recentSales.Where(s => s.CreatedAt.Date == day).ToList();
                    return new TrendDayDto
                    {
                        Date         = day.ToString("MMM dd"),
                        TotalSales   = daySales.Sum(s => s.FinalAmount),
                        Transactions = daySales.Count,
                    };
                }).ToList();

            return new DashboardDto
            {
                TodayRevenue      = todayRevenue,
                TodayProfit       = todayProfit,
                TodayTransactions = todayTransactions,
                LowStockCount     = lowStockItems.Count,
                LowStockItems     = lowStockItems,
                TopProducts       = topProducts,
                Trend             = trend,
            };
        }
    }
}