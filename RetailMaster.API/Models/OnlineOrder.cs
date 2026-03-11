using System;
using System.Collections.Generic;

namespace POSSystem.Models
{
    public class OnlineOrder : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public int? UserId { get; set; }
    public User? User { get; set; }
    
    // Customer details
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public string? DeliveryInstructions { get; set; }
    
    public decimal Subtotal { get; set; }
    public decimal DeliveryFee { get; set; } = 0;
    public decimal TotalAmount { get; set; }
    
    // Status tracking
    public OnlineOrderStatus Status { get; set; } = OnlineOrderStatus.Pending;
    public OnlinePaymentStatus PaymentStatus { get; set; } = OnlinePaymentStatus.Pending;
    public OnlinePaymentMethod PaymentMethod { get; set; } = OnlinePaymentMethod.CashOnDelivery;
    
    // Notification tracking
    public bool IsNotified { get; set; } = false;
    public DateTime? NotifiedAt { get; set; }
    public int? AcceptedByUserId { get; set; }
    public User? AcceptedByUser { get; set; }
    public int? DeliveredByUserId { get; set; }
    public User? DeliveredByUser { get; set; }
    
    // Status timestamps
    public DateTime? AcceptedAt { get; set; }
    public DateTime? ReadyForPickupAt { get; set; }
    public DateTime? OutForDeliveryAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    
    public List<OnlineOrderItem> Items { get; set; } = new();
}
    public class OnlineOrderItem
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public int OnlineOrderId { get; set; }
        public OnlineOrder? OnlineOrder { get; set; }
        public int ProductId { get; set; }
        public Product? Product { get; set; }
        public string ProductName { get; set; } = string.Empty; // Snapshot at order time
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal Subtotal { get; set; }
        public bool IsDeleted { get; set; } = false;
    }

    public enum OnlineOrderStatus
    {
        Pending,        // Order placed, waiting for branch acceptance
        Accepted,       // Branch accepted the order
        Preparing,      // Being prepared
        ReadyForPickup, // Ready for customer to pick up
        OutForDelivery, // Out for delivery (if delivery option)
        Delivered,      // Successfully delivered/picked up
        Cancelled,      // Order cancelled
        Rejected        // Branch rejected the order
    }

    public enum OnlinePaymentStatus
    {
        Pending,
        Paid,
        Failed,
        Refunded
    }

    public enum OnlinePaymentMethod
    {
        CashOnDelivery,
        OnlinePayment,
        CardOnDelivery
    }
}