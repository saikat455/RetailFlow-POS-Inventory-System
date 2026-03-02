using Microsoft.EntityFrameworkCore;
using POSSystem.Data;
using POSSystem.DTOs;

namespace POSSystem.Services
{
    public class DashboardService
    {
        private readonly AppDbContext _db;

        public DashboardService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<DashboardDto> GetDashboardAsync()
        {
            var today = DateTime.UtcNow.Date;
            var todayEnd = today.AddDays(1);

            // Today's sales and transactions
            var todaySales = await _db.Sales
                .Where(s => s.SaleDate >= today && s.SaleDate < todayEnd)
                .ToListAsync();

            var todaySalesTotal = todaySales.Sum(s => s.FinalAmount);
            var todayTransactions = todaySales.Count;

            // Today's profit from sale items
            var todaySaleIds = todaySales.Select(s => s.Id).ToList();
            var todayProfit = await _db.SaleItems
                .Where(si => todaySaleIds.Contains(si.SaleId))
                .SumAsync(si => (decimal?)si.Profit) ?? 0;

            // Low stock items
            var lowStockItems = await _db.Products
                .Where(p => p.StockQty <= p.LowStockThreshold)
                .Select(p => new LowStockItemDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    StockQty = p.StockQty,
                    LowStockThreshold = p.LowStockThreshold
                })
                .ToListAsync();

            // Top 5 selling products (last 30 days)
            var thirtyDaysAgo = today.AddDays(-30);
            var topProducts = await _db.SaleItems
                .Include(si => si.Product)
                .Include(si => si.Sale)
                .Where(si => si.Sale!.SaleDate >= thirtyDaysAgo)
                .GroupBy(si => si.Product!.Name)
                .Select(g => new TopProductDto
                {
                    Name = g.Key,
                    TotalQtySold = g.Sum(si => si.Quantity),
                    TotalRevenue = g.Sum(si => si.UnitPrice * si.Quantity)
                })
                .OrderByDescending(p => p.TotalQtySold)
                .Take(5)
                .ToListAsync();

            // Sales trend - last 7 days
            var sevenDaysAgo = today.AddDays(-6);
            var recentSales = await _db.Sales
                .Include(s => s.SaleItems)
                .Where(s => s.SaleDate >= sevenDaysAgo)
                .ToListAsync();

            var salesTrend = Enumerable.Range(0, 7)
                .Select(i =>
                {
                    var date = sevenDaysAgo.AddDays(i);
                    var daysSales = recentSales.Where(s => s.SaleDate.Date == date).ToList();
                    var dayProfit = daysSales.SelectMany(s => s.SaleItems).Sum(si => si.Profit);
                    return new SalesTrendDto
                    {
                        Date = date.ToString("MMM dd"),
                        Sales = daysSales.Sum(s => s.FinalAmount),
                        Profit = dayProfit
                    };
                })
                .ToList();

            return new DashboardDto
            {
                TodaySales = todaySalesTotal,
                TodayProfit = todayProfit,
                TodayTransactions = todayTransactions,
                LowStockCount = lowStockItems.Count,
                LowStockItems = lowStockItems,
                TopProducts = topProducts,
                SalesTrend = salesTrend
            };
        }
    }
}
