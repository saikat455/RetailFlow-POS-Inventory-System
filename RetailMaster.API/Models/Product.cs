namespace POSSystem.Models
{
    public class Product : BaseEntity
    {
        public string  Name          { get; set; } = string.Empty;
        public string? Barcode       { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice  { get; set; }

        public List<BranchProduct> BranchStocks { get; set; } = new();
    }
}