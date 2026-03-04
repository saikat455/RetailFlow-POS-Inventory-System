// using Microsoft.EntityFrameworkCore;
// using POSSystem.Data;
// using POSSystem.DTOs;

// namespace POSSystem.Services
// {
//     public class SalesReportService
//     {
//         private readonly AppDbContext _db;
//         private readonly ICurrentCompanyService _ctx;

//         public SalesReportService(AppDbContext db, ICurrentCompanyService ctx)
//         {
//             _db = db; _ctx = ctx;
//         }

//         public async Task<SalesReportDto> GetReportAsync(SalesReportFilterDto filter)
//         {
//             var companyId = _ctx.CompanyId;

//             // Default date range: this month
//             var from = (filter.From ?? DateTime.UtcNow.Date.AddDays(1 - DateTime.UtcNow.Day))
//                            .Date;
//             var to   = (filter.To ?? DateTime.UtcNow.Date).Date.AddDays(1); // exclusive

//             // ── Base query ────────────────────────────────────
//             var salesQuery = _db.Sales
//                 .Where(s => s.CompanyId == companyId
//                          && !s.IsDeleted
//                          && s.CreatedAt >= from
//                          && s.CreatedAt < to);

//             if (filter.BranchId.HasValue)
//                 salesQuery = salesQuery.Where(s => s.BranchId == filter.BranchId.Value);

//             if (filter.CashierId.HasValue)
//                 salesQuery = salesQuery.Where(s => s.UserId == filter.CashierId.Value);

//             // Load with items for profit calculation
//             var sales = await salesQuery
//                 .Include(s => s.User)
//                 .Include(s => s.Branch)
//                 .Include(s => s.SaleItems.Where(si => si.CompanyId == companyId && !si.IsDeleted))
//                     .ThenInclude(si => si.Product)
//                 .OrderByDescending(s => s.CreatedAt)
//                 .ToListAsync();

//             // ── Summary ───────────────────────────────────────
//             var totalSales    = sales.Sum(s => s.FinalAmount);
//             var totalProfit   = sales.SelectMany(s => s.SaleItems).Sum(si => si.Profit);
//             var totalDiscount = sales.Sum(s => s.Discount);
//             var txCount       = sales.Count;

//             var summary = new SalesReportSummaryDto
//             {
//                 TotalSales        = totalSales,
//                 TotalProfit       = totalProfit,
//                 TotalDiscount     = totalDiscount,
//                 TotalTransactions = txCount,
//                 AverageOrderValue = txCount > 0 ? Math.Round(totalSales / txCount, 2) : 0,
//             };

//             // ── Trend (day or month) ──────────────────────────
//             List<SalesReportRowDto> trend;
//             if (filter.GroupBy == "month")
//             {
//                 trend = sales
//                     .GroupBy(s => new { s.CreatedAt.Year, s.CreatedAt.Month })
//                     .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
//                     .Select(g => new SalesReportRowDto
//                     {
//                         Period       = $"{new DateTime(g.Key.Year, g.Key.Month, 1):MMM yyyy}",
//                         Sales        = g.Sum(s => s.FinalAmount),
//                         Profit       = g.SelectMany(s => s.SaleItems).Sum(si => si.Profit),
//                         Discount     = g.Sum(s => s.Discount),
//                         Transactions = g.Count(),
//                     }).ToList();
//             }
//             else // day
//             {
//                 trend = sales
//                     .GroupBy(s => s.CreatedAt.Date)
//                     .OrderBy(g => g.Key)
//                     .Select(g => new SalesReportRowDto
//                     {
//                         Period       = g.Key.ToString("dd MMM yyyy"),
//                         Sales        = g.Sum(s => s.FinalAmount),
//                         Profit       = g.SelectMany(s => s.SaleItems).Sum(si => si.Profit),
//                         Discount     = g.Sum(s => s.Discount),
//                         Transactions = g.Count(),
//                     }).ToList();
//             }

//             // ── By Branch ─────────────────────────────────────
//             var byBranch = sales
//                 .GroupBy(s => new { s.BranchId, s.Branch?.Name })
//                 .Select(g => new BranchSalesDto
//                 {
//                     BranchId     = g.Key.BranchId ?? 0,
//                     BranchName   = g.Key.Name ?? "Unknown",
//                     Sales        = g.Sum(s => s.FinalAmount),
//                     Profit       = g.SelectMany(s => s.SaleItems).Sum(si => si.Profit),
//                     Transactions = g.Count(),
//                 })
//                 .OrderByDescending(b => b.Sales)
//                 .ToList();

//             // ── Top Products ──────────────────────────────────
//             var topProducts = sales
//                 .SelectMany(s => s.SaleItems)
//                 .Where(si => si.CompanyId == companyId)
//                 .GroupBy(si => si.Product?.Name ?? "Deleted")
//                 .Select(g => new TopProductReportDto
//                 {
//                     Name    = g.Key,
//                     QtySold = g.Sum(si => si.Quantity),
//                     Revenue = g.Sum(si => si.UnitPrice * si.Quantity),
//                     Profit  = g.Sum(si => si.Profit),
//                 })
//                 .OrderByDescending(p => p.QtySold)
//                 .Take(10)
//                 .ToList();

//             // ── Detailed Transactions ─────────────────────────
//             var transactions = sales.Select(s => new SaleResponseDto
//             {
//                 Id            = s.Id,
//                 InvoiceNo     = s.InvoiceNo,
//                 SaleDate      = s.CreatedAt,
//                 BranchName    = s.Branch?.Name ?? string.Empty,
//                 CashierName   = s.User?.Name ?? "Unknown",
//                 CustomerName  = s.CustomerName,
//                 CustomerPhone = s.CustomerPhone,
//                 TotalAmount   = s.TotalAmount,
//                 Discount      = s.Discount,
//                 FinalAmount   = s.FinalAmount,
//                 TotalProfit   = s.SaleItems.Sum(si => si.Profit),
//                 Items = s.SaleItems
//                     .Where(si => si.CompanyId == companyId)
//                     .Select(si => new SaleItemResponseDto
//                     {
//                         ProductName = si.Product?.Name ?? "Deleted",
//                         Quantity    = si.Quantity,
//                         UnitPrice   = si.UnitPrice,
//                         Subtotal    = si.UnitPrice * si.Quantity,
//                         Profit      = si.Profit,
//                     }).ToList()
//             }).ToList();

//             return new SalesReportDto
//             {
//                 Summary      = summary,
//                 Trend        = trend,
//                 ByBranch     = byBranch,
//                 TopProducts  = topProducts,
//                 Transactions = transactions,
//             };
//         }

//         // ── Cashier filter list ───────────────────────────────
//         public async Task<List<CashierOptionDto>> GetCashiersAsync()
//         {
//             var companyId = _ctx.CompanyId;
//             return await _db.Users
//                 .Where(u => u.CompanyId == companyId && !u.IsDeleted)
//                 .Select(u => new CashierOptionDto { Id = u.Id, Name = u.Name })
//                 .OrderBy(u => u.Name)
//                 .ToListAsync();
//         }
//     }
// }

using Microsoft.EntityFrameworkCore;
using POSSystem.Data;
using POSSystem.DTOs;

namespace POSSystem.Services
{
    public class SalesReportService
    {
        private readonly AppDbContext _db;
        private readonly ICurrentCompanyService _ctx;

        public SalesReportService(AppDbContext db, ICurrentCompanyService ctx)
        {
            _db = db; 
            _ctx = ctx;
        }

        public async Task<SalesReportDto> GetReportAsync(SalesReportFilterDto filter)
        {
            var companyId = _ctx.CompanyId;

            // Get current UTC date
            var today = DateTime.UtcNow.Date;
            
            // Default date range: this month (with UTC)
            DateTime from;
            DateTime to;
            
            if (filter.From.HasValue)
            {
                from = EnsureUtc(filter.From.Value).Date;
            }
            else
            {
                // First day of current month at UTC
                from = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            }
            
            if (filter.To.HasValue)
            {
                // Add one day to make it exclusive and ensure UTC
                to = EnsureUtc(filter.To.Value).Date.AddDays(1);
            }
            else
            {
                // Tomorrow at UTC (for exclusive comparison)
                to = today.AddDays(1);
            }

            // ── Base query ────────────────────────────────────
            var salesQuery = _db.Sales
                .Where(s => s.CompanyId == companyId
                         && !s.IsDeleted
                         && s.CreatedAt >= from
                         && s.CreatedAt < to);

            if (filter.BranchId.HasValue)
                salesQuery = salesQuery.Where(s => s.BranchId == filter.BranchId.Value);

            if (filter.CashierId.HasValue)
                salesQuery = salesQuery.Where(s => s.UserId == filter.CashierId.Value);

            // Load with items for profit calculation
            var sales = await salesQuery
                .Include(s => s.User)
                .Include(s => s.Branch)
                .Include(s => s.SaleItems.Where(si => si.CompanyId == companyId && !si.IsDeleted))
                    .ThenInclude(si => si.Product)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            // ── Summary ───────────────────────────────────────
            var totalSales    = sales.Sum(s => s.FinalAmount);
            var totalProfit   = sales.SelectMany(s => s.SaleItems).Sum(si => si.Profit);
            var totalDiscount = sales.Sum(s => s.Discount);
            var txCount       = sales.Count;

            var summary = new SalesReportSummaryDto
            {
                TotalSales        = totalSales,
                TotalProfit       = totalProfit,
                TotalDiscount     = totalDiscount,
                TotalTransactions = txCount,
                AverageOrderValue = txCount > 0 ? Math.Round(totalSales / txCount, 2) : 0,
            };

            // ── Trend (day or month) ──────────────────────────
            List<SalesReportRowDto> trend;
            if (filter.GroupBy == "month")
            {
                trend = sales
                    .GroupBy(s => new { s.CreatedAt.Year, s.CreatedAt.Month })
                    .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                    .Select(g => new SalesReportRowDto
                    {
                        Period       = $"{new DateTime(g.Key.Year, g.Key.Month, 1, 0, 0, 0, DateTimeKind.Utc):MMM yyyy}",
                        Sales        = g.Sum(s => s.FinalAmount),
                        Profit       = g.SelectMany(s => s.SaleItems).Sum(si => si.Profit),
                        Discount     = g.Sum(s => s.Discount),
                        Transactions = g.Count(),
                    }).ToList();
            }
            else // day
            {
                trend = sales
                    .GroupBy(s => s.CreatedAt.Date)
                    .OrderBy(g => g.Key)
                    .Select(g => new SalesReportRowDto
                    {
                        Period       = DateTime.SpecifyKind(g.Key, DateTimeKind.Utc).ToString("dd MMM yyyy"),
                        Sales        = g.Sum(s => s.FinalAmount),
                        Profit       = g.SelectMany(s => s.SaleItems).Sum(si => si.Profit),
                        Discount     = g.Sum(s => s.Discount),
                        Transactions = g.Count(),
                    }).ToList();
            }

            // ── By Branch ─────────────────────────────────────
            var byBranch = sales
                .GroupBy(s => new { s.BranchId, s.Branch?.Name })
                .Select(g => new BranchSalesDto
                {
                    BranchId     = g.Key.BranchId ?? 0,
                    BranchName   = g.Key.Name ?? "Unknown",
                    Sales        = g.Sum(s => s.FinalAmount),
                    Profit       = g.SelectMany(s => s.SaleItems).Sum(si => si.Profit),
                    Transactions = g.Count(),
                })
                .OrderByDescending(b => b.Sales)
                .ToList();

            // ── Top Products ──────────────────────────────────
            var topProducts = sales
                .SelectMany(s => s.SaleItems)
                .Where(si => si.CompanyId == companyId)
                .GroupBy(si => si.Product?.Name ?? "Deleted")
                .Select(g => new TopProductReportDto
                {
                    Name    = g.Key,
                    QtySold = g.Sum(si => si.Quantity),
                    Revenue = g.Sum(si => si.UnitPrice * si.Quantity),
                    Profit  = g.Sum(si => si.Profit),
                })
                .OrderByDescending(p => p.QtySold)
                .Take(10)
                .ToList();

            // ── Detailed Transactions ─────────────────────────
            var transactions = sales.Select(s => new SaleResponseDto
            {
                Id            = s.Id,
                InvoiceNo     = s.InvoiceNo,
                SaleDate      = EnsureUtc(s.CreatedAt),
                BranchName    = s.Branch?.Name ?? string.Empty,
                CashierName   = s.User?.Name ?? "Unknown",
                CustomerName  = s.CustomerName,
                CustomerPhone = s.CustomerPhone,
                TotalAmount   = s.TotalAmount,
                Discount      = s.Discount,
                FinalAmount   = s.FinalAmount,
                TotalProfit   = s.SaleItems.Sum(si => si.Profit),
                Items = s.SaleItems
                    .Where(si => si.CompanyId == companyId)
                    .Select(si => new SaleItemResponseDto
                    {
                        ProductName = si.Product?.Name ?? "Deleted",
                        Quantity    = si.Quantity,
                        UnitPrice   = si.UnitPrice,
                        Subtotal    = si.UnitPrice * si.Quantity,
                        Profit      = si.Profit,
                    }).ToList()
            }).ToList();

            return new SalesReportDto
            {
                Summary      = summary,
                Trend        = trend,
                ByBranch     = byBranch,
                TopProducts  = topProducts,
                Transactions = transactions,
            };
        }

        /// <summary>
        /// Ensures a DateTime value has Utc kind
        /// </summary>
        private static DateTime EnsureUtc(DateTime dateTime)
        {
            if (dateTime.Kind == DateTimeKind.Unspecified)
                return DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
            
            if (dateTime.Kind == DateTimeKind.Local)
                return dateTime.ToUniversalTime();
            
            return dateTime; // Already Utc
        }

        /// <summary>
        /// Gets list of cashiers for filter dropdown
        /// </summary>
        public async Task<List<CashierOptionDto>> GetCashiersAsync()
        {
            var companyId = _ctx.CompanyId;
            return await _db.Users
                .Where(u => u.CompanyId == companyId && !u.IsDeleted)
                .Select(u => new CashierOptionDto 
                { 
                    Id = u.Id, 
                    Name = u.Name 
                })
                .OrderBy(u => u.Name)
                .ToListAsync();
        }
    }
}