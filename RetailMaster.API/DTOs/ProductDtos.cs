namespace POSSystem.DTOs
{
    // ── Admin: add to catalogue ───────────────────────────────
    public class ProductCreateDto
    {
        public string  Name          { get; set; } = string.Empty;
        public string? Barcode       { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice  { get; set; }
    }

    public class ProductUpdateDto
    {
        public string  Name          { get; set; } = string.Empty;
        public string? Barcode       { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice  { get; set; }
    }

    // ── Admin: assign stock to a specific branch ──────────────
    public class AssignStockDto
    {
        public int BranchId          { get; set; }
        public int ProductId         { get; set; }
        public int StockQty          { get; set; }
        public int LowStockThreshold { get; set; } = 5;
    }

    // ── Admin: update qty or threshold for a branch ───────────
    public class AdjustStockDto
    {
        public int StockQty          { get; set; }
        public int LowStockThreshold { get; set; } = 5;
    }

    // ── Product response (includes branch-specific stock) ─────
    public class ProductResponseDto
    {
        public int     Id                { get; set; }
        public string  Name              { get; set; } = string.Empty;
        public string? Barcode           { get; set; }
        public decimal PurchasePrice     { get; set; }
        public decimal SellingPrice      { get; set; }
        public int     StockQty          { get; set; }   // for the requested branch
        public int     LowStockThreshold { get; set; }
        public bool    IsLowStock        { get; set; }
        public DateTime CreatedDate      { get; set; }

        // Only included in Admin detail view
        public List<BranchStockDto>? BranchStocks { get; set; }
    }

    // ── Per-branch stock line (Admin detail view) ─────────────
    public class BranchStockDto
    {
        public int    BranchId          { get; set; }
        public string BranchName        { get; set; } = string.Empty;
        public int    StockQty          { get; set; }
        public int    LowStockThreshold { get; set; }
        public bool   IsLowStock        { get; set; }
    }

    // ── Catalogue row (Admin list, no branch stock) ───────────
    public class ProductCatalogueDto
    {
        public int     Id             { get; set; }
        public string  Name           { get; set; } = string.Empty;
        public string? Barcode        { get; set; }
        public decimal PurchasePrice  { get; set; }
        public decimal SellingPrice   { get; set; }
        public DateTime CreatedDate   { get; set; }
        public int     TotalBranches  { get; set; } // how many branches have stock assigned
        public List<BranchStockDto> BranchStocks { get; set; } = new();
    }
}