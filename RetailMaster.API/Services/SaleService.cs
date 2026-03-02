using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using POSSystem.Data;
using POSSystem.DTOs;
using POSSystem.Models;

namespace POSSystem.Services
{
    public class SaleService
    {
        private readonly AppDbContext _db;

        public SaleService(AppDbContext db) => _db = db;

        public async Task<(bool success, string message, SaleResponseDto? data)> CreateSaleAsync(
            CreateSaleDto dto, int userId)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                return (false, "Sale must have at least one item.", null);

            // Load all products in one query
            var productIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _db.Products
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync();

            // Validate stock
            foreach (var item in dto.Items)
            {
                var product = products.FirstOrDefault(p => p.Id == item.ProductId);
                if (product == null)
                    return (false, $"Product ID {item.ProductId} not found.", null);
                if (item.Quantity <= 0)
                    return (false, $"Quantity for '{product.Name}' must be greater than 0.", null);
                if (product.StockQty < item.Quantity)
                    return (false, $"Insufficient stock for '{product.Name}'. Available: {product.StockQty}, Requested: {item.Quantity}", null);
            }

            // Build sale inside a transaction
            using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                var saleItems = new List<SaleItem>();
                decimal totalAmount = 0;

                foreach (var item in dto.Items)
                {
                    var product = products.First(p => p.Id == item.ProductId);
                    var subtotal = product.SellingPrice * item.Quantity;
                    var profit = (product.SellingPrice - product.PurchasePrice) * item.Quantity;

                    saleItems.Add(new SaleItem
                    {
                        ProductId = product.Id,
                        Quantity = item.Quantity,
                        UnitPrice = product.SellingPrice,
                        Profit = profit,
                    });

                    // Deduct stock
                    product.StockQty -= item.Quantity;
                    totalAmount += subtotal;
                }

                var discount = Math.Max(0, dto.Discount);
                var finalAmount = Math.Max(0, totalAmount - discount);

                var sale = new Sale
                {
                    UserId = userId,
                    SaleDate = DateTime.UtcNow,
                    TotalAmount = totalAmount,
                    Discount = discount,
                    FinalAmount = finalAmount,
                    SaleItems = saleItems,
                };

                _db.Sales.Add(sale);
                await _db.SaveChangesAsync();
                await tx.CommitAsync();

                // Build response
                var user = await _db.Users.FindAsync(userId);
                var response = new SaleResponseDto
                {
                    Id = sale.Id,
                    SaleDate = sale.SaleDate,
                    TotalAmount = sale.TotalAmount,
                    Discount = sale.Discount,
                    FinalAmount = sale.FinalAmount,
                    TotalProfit = saleItems.Sum(si => si.Profit),
                    CashierName = user?.Name ?? "Unknown",
                    Items = saleItems.Select(si =>
                    {
                        var p = products.First(x => x.Id == si.ProductId);
                        return new SaleItemResponseDto
                        {
                            ProductName = p.Name,
                            Quantity = si.Quantity,
                            UnitPrice = si.UnitPrice,
                            Subtotal = si.UnitPrice * si.Quantity,
                            Profit = si.Profit,
                        };
                    }).ToList()
                };

                return (true, "Sale completed successfully.", response);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return (false, $"Sale failed: {ex.Message}", null);
            }
        }

        public async Task<List<SaleResponseDto>> GetRecentSalesAsync(int take = 20)
        {
            var sales = await _db.Sales
                .Include(s => s.SaleItems).ThenInclude(si => si.Product)
                .Include(s => s.User)
                .OrderByDescending(s => s.SaleDate)
                .Take(take)
                .ToListAsync();

            return sales.Select(s => new SaleResponseDto
            {
                Id = s.Id,
                SaleDate = s.SaleDate,
                TotalAmount = s.TotalAmount,
                Discount = s.Discount,
                FinalAmount = s.FinalAmount,
                TotalProfit = s.SaleItems.Sum(si => si.Profit),
                CashierName = s.User?.Name ?? "Unknown",
                Items = s.SaleItems.Select(si => new SaleItemResponseDto
                {
                    ProductName = si.Product?.Name ?? "Deleted",
                    Quantity = si.Quantity,
                    UnitPrice = si.UnitPrice,
                    Subtotal = si.UnitPrice * si.Quantity,
                    Profit = si.Profit,
                }).ToList()
            }).ToList();
        }
    }
}
