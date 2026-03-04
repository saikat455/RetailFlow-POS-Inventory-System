namespace POSSystem.DTOs
{
    public class CreateSaleDto
    {
        public int     BranchId      { get; set; }   // required — which branch is making this sale
        public decimal Discount      { get; set; } = 0;
        public string? CustomerName  { get; set; }
        public string? CustomerPhone { get; set; }
        public List<SaleItemDto> Items { get; set; } = new();
    }

    public class SaleItemDto
    {
        public int ProductId { get; set; }
        public int Quantity  { get; set; }
    }

    public class SaleResponseDto
    {
        public int     Id           { get; set; }
        public string  InvoiceNo    { get; set; } = string.Empty;
        public DateTime SaleDate    { get; set; }
        public string  BranchName   { get; set; } = string.Empty;
        public string  CashierName  { get; set; } = string.Empty;
        public string? CustomerName  { get; set; }
        public string? CustomerPhone { get; set; }
        public decimal TotalAmount  { get; set; }
        public decimal Discount     { get; set; }
        public decimal FinalAmount  { get; set; }
        public decimal TotalProfit  { get; set; }
        public List<SaleItemResponseDto> Items { get; set; } = new();

        // Company info for invoice header
        public string  CompanyName    { get; set; } = string.Empty;
        public string? CompanyAddress { get; set; }
        public string? CompanyPhone   { get; set; }
        public string? BranchAddress  { get; set; }
        public string? BranchPhone    { get; set; }
    }

    public class SaleItemResponseDto
    {
        public string  ProductName { get; set; } = string.Empty;
        public int     Quantity    { get; set; }
        public decimal UnitPrice   { get; set; }
        public decimal Subtotal    { get; set; }
        public decimal Profit      { get; set; }
    }
}