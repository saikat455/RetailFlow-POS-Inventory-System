using Microsoft.EntityFrameworkCore;
using POSSystem.Data;
using POSSystem.DTOs;
using POSSystem.Models;

namespace POSSystem.Services
{
    public class OrderManagementService
    {
        private readonly AppDbContext _db;
        private readonly ICurrentCompanyService _ctx;
        private readonly ILogger<OrderManagementService> _logger;

        public OrderManagementService(
            AppDbContext db, 
            ICurrentCompanyService ctx,
            ILogger<OrderManagementService> logger)
        {
            _db = db;
            _ctx = ctx;
            _logger = logger;
        }

        /// <summary>
        /// Get orders for current branch (cashier view) or all branches (admin view)
        /// </summary>
        public async Task<List<BranchOrderListItemDto>> GetBranchOrdersAsync(string? status = null)
        {
            var companyId = _ctx.CompanyId;
            
            var query = _db.OnlineOrders
                .Include(o => o.Items)
                .Where(o => o.CompanyId == companyId && !o.IsDeleted);

            // If cashier, only show their branch
            if (!_ctx.IsAdmin && _ctx.BranchId.HasValue)
            {
                query = query.Where(o => o.BranchId == _ctx.BranchId.Value);
            }

            // Filter by status if provided
            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OnlineOrderStatus>(status, true, out var statusEnum))
            {
                query = query.Where(o => o.Status == statusEnum);
            }

            var orders = await query
                .OrderByDescending(o => o.Status == OnlineOrderStatus.Pending)
                .ThenByDescending(o => o.CreatedAt)
                .ToListAsync();

            return orders.Select(o => new BranchOrderListItemDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                CustomerName = o.CustomerName,
                CustomerPhone = o.CustomerPhone,
                DeliveryAddress = o.DeliveryAddress,
                TotalAmount = o.TotalAmount,
                Status = o.Status.ToString(),
                CreatedAt = o.CreatedAt,
                ItemCount = o.Items.Count,
                IsNotified = o.IsNotified
            }).ToList();
        }

        /// <summary>
        /// Get order details by ID
        /// </summary>
        public async Task<BranchOrderDetailDto?> GetOrderByIdAsync(int orderId)
        {
            var companyId = _ctx.CompanyId;
            
            var order = await _db.OnlineOrders
                .Include(o => o.Branch)
                .Include(o => o.Items)
                .Include(o => o.AcceptedByUser)
                .Include(o => o.DeliveredByUser)
                .FirstOrDefaultAsync(o => o.Id == orderId 
                    && o.CompanyId == companyId 
                    && !o.IsDeleted);

            if (order == null) return null;

            // If cashier, ensure they can only view their branch orders
            if (!_ctx.IsAdmin && _ctx.BranchId.HasValue && order.BranchId != _ctx.BranchId.Value)
                return null;

            return new BranchOrderDetailDto
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
                Subtotal = order.Subtotal,
                DeliveryFee = order.DeliveryFee,
                TotalAmount = order.TotalAmount,
                Status = order.Status.ToString(),
                PaymentMethod = order.PaymentMethod.ToString(),
                CreatedAt = order.CreatedAt,
                AcceptedAt = order.AcceptedAt,
                ReadyForPickupAt = order.ReadyForPickupAt,
                OutForDeliveryAt = order.OutForDeliveryAt,
                DeliveredAt = order.DeliveredAt,
                CancelledAt = order.CancelledAt,
                CancellationReason = order.CancellationReason,
                AcceptedBy = order.AcceptedByUser?.Name,
                DeliveredBy = order.DeliveredByUser?.Name,
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

        /// <summary>
        /// Update order status (accept, ready, out-for-delivery, deliver, cancel)
        /// </summary>
        public async Task<(bool success, string message, BranchOrderDetailDto? data)> UpdateOrderStatusAsync(
            int orderId, UpdateOrderStatusDto dto)
        {
            var companyId = _ctx.CompanyId;
            
            var order = await _db.OnlineOrders
                .Include(o => o.Branch)
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId 
                    && o.CompanyId == companyId 
                    && !o.IsDeleted);

            if (order == null)
                return (false, "Order not found.", null);

            // If cashier, ensure they can only update their branch orders
            if (!_ctx.IsAdmin && _ctx.BranchId.HasValue && order.BranchId != _ctx.BranchId.Value)
                return (false, "You don't have permission to update this order.", null);

            // Validate status transition
            var validation = ValidateStatusTransition(order.Status, dto.Status);
            if (!validation.valid)
                return (false, validation.message, null);

            // Update order based on new status
            order.Status = dto.Status;
            order.UpdatedAt = DateTime.UtcNow;

            switch (dto.Status)
            {
                case OnlineOrderStatus.Accepted:
                    order.AcceptedAt = DateTime.UtcNow;
                    order.AcceptedByUserId = _ctx.UserId;
                    break;
                    
                case OnlineOrderStatus.ReadyForPickup:
                    order.ReadyForPickupAt = DateTime.UtcNow;
                    break;
                    
                case OnlineOrderStatus.OutForDelivery:
                    order.OutForDeliveryAt = DateTime.UtcNow;
                    break;
                    
                case OnlineOrderStatus.Delivered:
                    order.DeliveredAt = DateTime.UtcNow;
                    order.DeliveredByUserId = _ctx.UserId;
                    order.PaymentStatus = OnlinePaymentStatus.Paid;
                    break;
                    
                case OnlineOrderStatus.Cancelled:
                    order.CancelledAt = DateTime.UtcNow;
                    order.CancellationReason = dto.CancellationReason;
                    break;
            }

            await _db.SaveChangesAsync();

            var updatedOrder = await GetOrderByIdAsync(orderId);
            return (true, $"Order {dto.Status} successfully.", updatedOrder);
        }

        /// <summary>
        /// Mark order as notified (when cashier views new order)
        /// </summary>
        public async Task MarkAsNotifiedAsync(int orderId)
        {
            var order = await _db.OnlineOrders.FindAsync(orderId);
            if (order != null && !order.IsNotified)
            {
                order.IsNotified = true;
                order.NotifiedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Get new orders (not yet notified) for the current branch
        /// </summary>
        public async Task<List<OrderNotificationDto>> GetNewOrdersAsync()
        {
            var companyId = _ctx.CompanyId;
            
            var query = _db.OnlineOrders
                .Include(o => o.Items)
                .Where(o => o.CompanyId == companyId 
                    && !o.IsDeleted 
                    && !o.IsNotified 
                    && o.Status == OnlineOrderStatus.Pending);

            // If cashier, only their branch
            if (!_ctx.IsAdmin && _ctx.BranchId.HasValue)
            {
                query = query.Where(o => o.BranchId == _ctx.BranchId.Value);
            }

            var newOrders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Take(10)
                .ToListAsync();

            return newOrders.Select(o => new OrderNotificationDto
            {
                OrderId = o.Id,
                OrderNumber = o.OrderNumber,
                CustomerName = o.CustomerName,
                TotalAmount = o.TotalAmount,
                CreatedAt = o.CreatedAt,
                ItemCount = o.Items.Count
            }).ToList();
        }

        /// <summary>
        /// Get order statistics for dashboard
        /// </summary>
        public async Task<BranchOrderStatsDto> GetOrderStatsAsync()
        {
            var companyId = _ctx.CompanyId;
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var query = _db.OnlineOrders
                .Where(o => o.CompanyId == companyId && !o.IsDeleted);

            // If cashier, only their branch
            if (!_ctx.IsAdmin && _ctx.BranchId.HasValue)
            {
                query = query.Where(o => o.BranchId == _ctx.BranchId.Value);
            }

            var orders = await query.ToListAsync();

            return new BranchOrderStatsDto
            {
                PendingCount = orders.Count(o => o.Status == OnlineOrderStatus.Pending),
                AcceptedCount = orders.Count(o => o.Status == OnlineOrderStatus.Accepted),
                ReadyCount = orders.Count(o => o.Status == OnlineOrderStatus.ReadyForPickup),
                OutForDeliveryCount = orders.Count(o => o.Status == OnlineOrderStatus.OutForDelivery),
                CompletedToday = orders.Count(o => o.Status == OnlineOrderStatus.Delivered 
                    && o.DeliveredAt >= today && o.DeliveredAt < tomorrow),
                TodayRevenue = orders
                    .Where(o => o.Status == OnlineOrderStatus.Delivered 
                        && o.DeliveredAt >= today && o.DeliveredAt < tomorrow)
                    .Sum(o => o.TotalAmount)
            };
        }

        /// <summary>
        /// Validate order status transitions
        /// </summary>
        private (bool valid, string message) ValidateStatusTransition(
            OnlineOrderStatus current, OnlineOrderStatus newStatus)
        {
            // Define allowed transitions (simplified flow)
            var allowedTransitions = new Dictionary<OnlineOrderStatus, List<OnlineOrderStatus>>
            {
                { OnlineOrderStatus.Pending, new List<OnlineOrderStatus> 
                    { OnlineOrderStatus.Accepted, OnlineOrderStatus.Cancelled } },
                { OnlineOrderStatus.Accepted, new List<OnlineOrderStatus> 
                    { OnlineOrderStatus.ReadyForPickup, OnlineOrderStatus.Cancelled } },
                { OnlineOrderStatus.ReadyForPickup, new List<OnlineOrderStatus> 
                    { OnlineOrderStatus.OutForDelivery, OnlineOrderStatus.Cancelled } },
                { OnlineOrderStatus.OutForDelivery, new List<OnlineOrderStatus> 
                    { OnlineOrderStatus.Delivered, OnlineOrderStatus.Cancelled } },
                { OnlineOrderStatus.Delivered, new List<OnlineOrderStatus>() },
                { OnlineOrderStatus.Cancelled, new List<OnlineOrderStatus>() }
            };

            if (current == newStatus)
                return (false, $"Order is already {current}");

            if (!allowedTransitions.ContainsKey(current))
                return (false, $"Invalid current status: {current}");

            if (!allowedTransitions[current].Contains(newStatus))
                return (false, $"Cannot change order from {current} to {newStatus}");

            return (true, "Valid transition");
        }
    }
}