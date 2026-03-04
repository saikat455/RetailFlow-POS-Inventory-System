namespace POSSystem.Models
{
    /// <summary>
    /// Branch-level stock.  One row per (Branch × Product).
    ///
    ///   Dhanmondi Branch | Coca Cola | 50 units
    ///   Gulshan Branch   | Coca Cola | 30 units
    ///
    /// Selling in Dhanmondi only reduces that row.
    /// Gulshan's 30 units are completely unaffected.
    /// </summary>
    public class BranchProduct
    {
        public int  Id        { get; set; }
        public int  CompanyId { get; set; }
        public int  BranchId  { get; set; }
        public int  ProductId { get; set; }

        public int  StockQty          { get; set; } = 0;
        public int  LowStockThreshold { get; set; } = 5;
        public bool IsDeleted         { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Branch?  Branch  { get; set; }
        public Product? Product { get; set; }
    }
}
