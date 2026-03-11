using Microsoft.EntityFrameworkCore;
using POSSystem.Data;
using POSSystem.DTOs;
using POSSystem.Models;

namespace POSSystem.Services
{
    public class OnlineOrderService
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly ILogger<OnlineOrderService> _logger;

        public OnlineOrderService(AppDbContext db, IConfiguration config, ILogger<OnlineOrderService> logger)
        {
            _db = db;
            _config = config;
            _logger = logger;
        }

        /// <summary>
        /// Get all branches that accept online orders
        /// </summary>
        public async Task<List<OnlineBranchDto>> GetBranchesAsync()
        {
            return await _db.Branches
                .Where(b => !b.IsDeleted && b.AcceptsOnlineOrders && b.Company!.IsActive)
                .OrderBy(b => b.Name)
                .Select(b => new OnlineBranchDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    Address = b.Address,
                    Phone = b.Phone,
                    AcceptsOnlineOrders = b.AcceptsOnlineOrders
                })
                .ToListAsync();
        }

        /// <summary>
        /// Get products for a specific branch (public view)
        /// </summary>
        public async Task<List<PublicProductDto>> GetBranchProductsAsync(int branchId)
        {
            var branch = await _db.Branches
                .FirstOrDefaultAsync(b => b.Id == branchId && !b.IsDeleted && b.AcceptsOnlineOrders);
            
            if (branch == null)
                return new List<PublicProductDto>();

            var products = await _db.BranchProducts
                .Include(bp => bp.Product)
                .Where(bp => bp.BranchId == branchId 
                    && !bp.IsDeleted 
                    && !bp.Product!.IsDeleted
                    && bp.StockQty > 0)
                .OrderBy(bp => bp.Product!.Name)
                .Select(bp => new 
                {
                    bp.Product!.Id,
                    bp.Product.Name,
                    bp.Product.Barcode,
                    bp.Product.SellingPrice,
                    bp.StockQty
                })
                .ToListAsync();

            // Map to DTO after query - FIXED: Don't try to set IsAvailable in LINQ
            return products.Select(p => new PublicProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Barcode = p.Barcode,
                SellingPrice = p.SellingPrice,
                StockQty = p.StockQty
                // IsAvailable is read-only, calculated in the DTO itself
            }).ToList();
        }

        /// <summary>
        /// Validate if products are available and in stock
        /// </summary>
        private async Task<(bool valid, string message, List<BranchProduct>? stocks)> ValidateOrderItemsAsync(
            int branchId, List<OnlineOrderItemDto> items)
        {
            var productIds = items.Select(i => i.ProductId).Distinct().ToList();
            
            var branchStocks = await _db.BranchProducts
                .Include(bp => bp.Product)
                .Where(bp => bp.BranchId == branchId 
                    && !bp.IsDeleted 
                    && !bp.Product!.IsDeleted
                    && productIds.Contains(bp.ProductId))
                .ToListAsync();

            // Check if all products exist in this branch
            var missingProducts = productIds
                .Where(id => !branchStocks.Any(bp => bp.ProductId == id))
                .ToList();

            if (missingProducts.Any())
                return (false, $"Some products are not available in this branch.", null);

            // Check stock availability
            foreach (var item in items)
            {
                var stock = branchStocks.First(bp => bp.ProductId == item.ProductId);
                if (stock.StockQty < item.Quantity)
                {
                    var product = stock.Product!;
                    return (false, $"Insufficient stock for '{product.Name}'. Available: {stock.StockQty}", null);
                }
            }

            return (true, "Valid", branchStocks);
        }

        /// <summary>
        /// Generate unique order number
        /// </summary>
        private async Task<string> GenerateOrderNumberAsync(int companyId)
        {
            var today = DateTime.UtcNow;
            var count = await _db.OnlineOrders
                .IgnoreQueryFilters()
                .CountAsync(o => o.CompanyId == companyId && o.CreatedAt.Date == today.Date);
            
            return $"ORD-{today:yyyyMMdd}-{(count + 1):D5}";
        }

        /// <summary>
        /// Place a new online order
        /// </summary>
        public async Task<(bool success, string message, OnlineOrderResponseDto? data)> CreateOrderAsync(CreateOnlineOrderDto dto)
        {
            using var transaction = await _db.Database.BeginTransactionAsync();
            
            try
            {
                // Get branch info
                var branch = await _db.Branches
                    .Include(b => b.Company)
                    .FirstOrDefaultAsync(b => b.Id == dto.BranchId 
                        && !b.IsDeleted 
                        && b.AcceptsOnlineOrders 
                        && b.Company!.IsActive);

                if (branch == null)
                    return (false, "Branch not found or doesn't accept online orders.", null);

                if (dto.Items == null || dto.Items.Count == 0)
                    return (false, "Order must have at least one item.", null);

                // Validate stock
                var validation = await ValidateOrderItemsAsync(dto.BranchId, dto.Items);
                if (!validation.valid)
                    return (false, validation.message, null);

                var stocks = validation.stocks!;

                // Calculate totals
                decimal subtotal = 0;
                var orderItems = new List<OnlineOrderItem>();

                foreach (var item in dto.Items)
                {
                    var stock = stocks.First(s => s.ProductId == item.ProductId);
                    var product = stock.Product!;
                    var itemSubtotal = product.SellingPrice * item.Quantity;
                    
                    subtotal += itemSubtotal;
                    
                    orderItems.Add(new OnlineOrderItem
                    {
                        CompanyId = branch.CompanyId,
                        ProductId = product.Id,
                        ProductName = product.Name,
                        UnitPrice = product.SellingPrice,
                        Quantity = item.Quantity,
                        Subtotal = itemSubtotal
                    });
                }

                // For now, delivery fee is 0 (can be configured later)
                decimal deliveryFee = 0;
                decimal total = subtotal + deliveryFee;

                // Generate order number
                var orderNumber = await GenerateOrderNumberAsync(branch.CompanyId);

                // Create order
                var order = new OnlineOrder
                {
                    CompanyId = branch.CompanyId,
                    BranchId = branch.Id,
                    OrderNumber = orderNumber,
                    CustomerName = dto.CustomerName.Trim(),
                    CustomerEmail = dto.CustomerEmail.ToLower().Trim(),
                    CustomerPhone = dto.CustomerPhone.Trim(),
                    DeliveryAddress = dto.DeliveryAddress.Trim(),
                    DeliveryInstructions = dto.DeliveryInstructions?.Trim(),
                    Subtotal = subtotal,
                    DeliveryFee = deliveryFee,
                    TotalAmount = total,
                    PaymentMethod = Enum.Parse<OnlinePaymentMethod>(dto.PaymentMethod),
                    Status = OnlineOrderStatus.Pending,
                    PaymentStatus = OnlinePaymentStatus.Pending,
                    Items = orderItems
                };

                _db.OnlineOrders.Add(order);
                await _db.SaveChangesAsync();

                // Commit transaction
                await transaction.CommitAsync();

                // Return response
                var response = new OnlineOrderResponseDto
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    CustomerName = order.CustomerName,
                    CustomerEmail = order.CustomerEmail,
                    CustomerPhone = order.CustomerPhone,
                    DeliveryAddress = order.DeliveryAddress,
                    DeliveryInstructions = order.DeliveryInstructions,
                    BranchId = branch.Id,
                    BranchName = branch.Name,
                    BranchAddress = branch.Address ?? "",
                    BranchPhone = branch.Phone ?? "",
                    Subtotal = order.Subtotal,
                    DeliveryFee = order.DeliveryFee,
                    TotalAmount = order.TotalAmount,
                    Status = order.Status.ToString(),
                    PaymentStatus = order.PaymentStatus.ToString(),
                    PaymentMethod = order.PaymentMethod.ToString(),
                    CreatedAt = order.CreatedAt,
                    Items = order.Items.Select(i => new OnlineOrderItemResponseDto
                    {
                        ProductId = i.ProductId,
                        ProductName = i.ProductName,
                        UnitPrice = i.UnitPrice,
                        Quantity = i.Quantity,
                        Subtotal = i.Subtotal
                    }).ToList()
                };

                // TODO: Send confirmation email to customer
                // TODO: Send notification to branch

                return (true, "Order placed successfully!", response);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to create online order");
                return (false, "An error occurred while placing your order.", null);
            }
        }

        /// <summary>
        /// Track order by order number
        /// </summary>
        public async Task<OnlineOrderResponseDto?> TrackOrderAsync(string orderNumber)
        {
            var order = await _db.OnlineOrders
                .Include(o => o.Branch)
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber && !o.IsDeleted);

            if (order == null)
                return null;

            return new OnlineOrderResponseDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                CustomerName = order.CustomerName,
                CustomerEmail = order.CustomerEmail,
                CustomerPhone = order.CustomerPhone,
                DeliveryAddress = order.DeliveryAddress,
                DeliveryInstructions = order.DeliveryInstructions,
                BranchId = order.BranchId ?? 0,
                BranchName = order.Branch?.Name ?? "",
                BranchAddress = order.Branch?.Address ?? "",
                BranchPhone = order.Branch?.Phone ?? "",
                Subtotal = order.Subtotal,
                DeliveryFee = order.DeliveryFee,
                TotalAmount = order.TotalAmount,
                Status = order.Status.ToString(),
                PaymentStatus = order.PaymentStatus.ToString(),
                PaymentMethod = order.PaymentMethod.ToString(),
                CreatedAt = order.CreatedAt,
                Items = order.Items.Select(i => new OnlineOrderItemResponseDto
                {
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    UnitPrice = i.UnitPrice,
                    Quantity = i.Quantity,
                    Subtotal = i.Subtotal
                }).ToList()
            };
        }
    }
}