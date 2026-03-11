using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using POSSystem.Models;

namespace POSSystem.DTOs
{
    // For browsing products
    public class PublicProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Barcode { get; set; }
        public decimal SellingPrice { get; set; }
        public int StockQty { get; set; }
        public bool IsAvailable => StockQty > 0;
        public string? ImageUrl { get; set; }
        public string? Description { get; set; }
    }

    // For branch selection
    public class OnlineBranchDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public bool AcceptsOnlineOrders { get; set; } = true;
    }

    // Place order request
    public class CreateOnlineOrderDto
    {
        [Required]
        public int BranchId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string CustomerEmail { get; set; } = string.Empty;
        
        [Required]
        [Phone]
        public string CustomerPhone { get; set; } = string.Empty;
        
        [Required]
        public string DeliveryAddress { get; set; } = string.Empty;
        
        public string? DeliveryInstructions { get; set; }
        
        [Required]
        public string PaymentMethod { get; set; } = string.Empty;
        
        [MinLength(1, ErrorMessage = "At least one item is required")]
        public List<OnlineOrderItemDto> Items { get; set; } = new();
    }

    public class OnlineOrderItemDto
    {
        [Required]
        public int ProductId { get; set; }
        
        [Required]
        [Range(1, 999)]
        public int Quantity { get; set; }
    }

    // Order response
    public class OnlineOrderResponseDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string DeliveryAddress { get; set; } = string.Empty;
        public string? DeliveryInstructions { get; set; }
        
        public int BranchId { get; set; }
        public string BranchName { get; set; } = string.Empty;
        public string BranchAddress { get; set; } = string.Empty;
        public string BranchPhone { get; set; } = string.Empty;
        
        public decimal Subtotal { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }
        
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        public DateTime? EstimatedPickupTime { get; set; }
        
        public List<OnlineOrderItemResponseDto> Items { get; set; } = new();
    }

    public class OnlineOrderItemResponseDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal Subtotal { get; set; }
    }

    // For order tracking
    public class OrderTrackingDto
    {
        public string OrderNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string StatusDisplay { get; set; } = string.Empty;
        public List<OrderStatusHistoryDto> History { get; set; } = new();
    }

    public class OrderStatusHistoryDto
    {
        public string Status { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string? Note { get; set; }
    }

    // For admin/cashier order management (simplified version with just status and cancellation)
    public class UpdateOrderStatusDto
{
    [Required]
    public OnlineOrderStatus Status { get; set; }
    public string? CancellationReason { get; set; }
}

    // For listing orders in dashboard (basic info)
    public class OnlineOrderListItemDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string BranchName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int ItemCount { get; set; }
    }
}