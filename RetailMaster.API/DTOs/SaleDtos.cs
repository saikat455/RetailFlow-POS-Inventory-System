namespace POSSystem.DTOs
{
    public class CreateSaleDto
    {
        public decimal Discount { get; set; } = 0;
        public List<SaleItemDto> Items { get; set; } = new();
    }

    public class SaleItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class SaleResponseDto
    {
        public int Id { get; set; }
        public DateTime SaleDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Discount { get; set; }
        public decimal FinalAmount { get; set; }
        public decimal TotalProfit { get; set; }
        public string CashierName { get; set; } = string.Empty;
        public List<SaleItemResponseDto> Items { get; set; } = new();
    }

    public class SaleItemResponseDto
    {
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Profit { get; set; }
    }
}
