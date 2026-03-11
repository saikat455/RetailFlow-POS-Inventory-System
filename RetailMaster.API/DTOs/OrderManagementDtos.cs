using System.ComponentModel.DataAnnotations;
using POSSystem.Models;

namespace POSSystem.DTOs
{
    // For listing orders in branch dashboard
    public class BranchOrderListItemDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string DeliveryAddress { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int ItemCount { get; set; }
        public bool IsNotified { get; set; }
        public bool IsNew => !IsNotified && Status == "Pending";
    }

    // For detailed order view
    public class BranchOrderDetailDto
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
        
        public decimal Subtotal { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal TotalAmount { get; set; }
        
        public string Status { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public DateTime? ReadyForPickupAt { get; set; }
        public DateTime? OutForDeliveryAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancellationReason { get; set; }
        
        public string? AcceptedBy { get; set; }
        public string? DeliveredBy { get; set; }
        
        public List<OnlineOrderItemResponseDto> Items { get; set; } = new();
    }

    // For order notifications
    public class OrderNotificationDto
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public int ItemCount { get; set; }
    }

    // For dashboard stats
    public class BranchOrderStatsDto
    {
        public int PendingCount { get; set; }
        public int AcceptedCount { get; set; }
        public int ReadyCount { get; set; }
        public int OutForDeliveryCount { get; set; }
        public int CompletedToday { get; set; }
        public decimal TodayRevenue { get; set; }
    }
}