namespace POSSystem.DTOs
{
    public class ProductCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Barcode { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice { get; set; }
        public int StockQty { get; set; }
        public int LowStockThreshold { get; set; } = 5;
    }

    public class ProductUpdateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Barcode { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice { get; set; }
        public int StockQty { get; set; }
        public int LowStockThreshold { get; set; }
    }

    public class ProductResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Barcode { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice { get; set; }
        public int StockQty { get; set; }
        public int LowStockThreshold { get; set; }
        public bool IsLowStock { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
