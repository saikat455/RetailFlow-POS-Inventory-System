namespace POSSystem.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Barcode { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice { get; set; }
        public int StockQty { get; set; }
        public int LowStockThreshold { get; set; } = 5;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
