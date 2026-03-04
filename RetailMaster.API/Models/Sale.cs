namespace POSSystem.Models
{
    public class Sale : BaseEntity
    {
        // BranchId (from BaseEntity) is required for Sales — override to make clear
        public int    UserId      { get; set; }
        public User?  User        { get; set; }

        public string InvoiceNo   { get; set; } = string.Empty; // e.g. INV-2024-000001
        public decimal TotalAmount { get; set; }
        public decimal Discount    { get; set; }
        public decimal FinalAmount { get; set; }

        public string? CustomerName  { get; set; } // optional for invoice
        public string? CustomerPhone { get; set; }

        public List<SaleItem> SaleItems { get; set; } = new();
    }

    public class SaleItem
    {
        public int      Id        { get; set; }
        public int      CompanyId { get; set; }
        public int?     BranchId  { get; set; }
        public int      SaleId    { get; set; }
        public Sale?    Sale      { get; set; }
        public int      ProductId { get; set; }
        public Product? Product   { get; set; }
        public int      Quantity  { get; set; }
        public decimal  UnitPrice { get; set; }
        public decimal  Profit    { get; set; }
        public bool     IsDeleted { get; set; } = false;
    }
}