namespace POSSystem.DTOs
{
    // ── Filter params (passed as query string) ──
    public class SalesReportFilterDto
    {
        public DateTime? From       { get; set; }
        public DateTime? To         { get; set; }
        public int?      BranchId   { get; set; }
        public int?      CashierId  { get; set; }
        public string?   GroupBy    { get; set; } = "day"; // day | month
    }

    // ── Summary card at top of report ──
    public class SalesReportSummaryDto
    {
        public decimal TotalSales        { get; set; }
        public decimal TotalProfit       { get; set; }
        public decimal TotalDiscount     { get; set; }
        public int     TotalTransactions { get; set; }
        public decimal AverageOrderValue { get; set; }
    }

    // ── One row in the trend table (day or month) ──
    public class SalesReportRowDto
    {
        public string  Period       { get; set; } = string.Empty; // "2024-01-15" or "Jan 2024"
        public decimal Sales        { get; set; }
        public decimal Profit       { get; set; }
        public decimal Discount     { get; set; }
        public int     Transactions { get; set; }
    }

    // ── Branch breakdown ──
    public class BranchSalesDto
    {
        public int     BranchId   { get; set; }
        public string  BranchName { get; set; } = string.Empty;
        public decimal Sales      { get; set; }
        public decimal Profit     { get; set; }
        public int     Transactions { get; set; }
    }

    // ── Top product in report ──
    public class TopProductReportDto
    {
        public string  Name        { get; set; } = string.Empty;
        public int     QtySold     { get; set; }
        public decimal Revenue     { get; set; }
        public decimal Profit      { get; set; }
    }

    // ── Full report response ──
    public class SalesReportDto
    {
        public SalesReportSummaryDto      Summary        { get; set; } = new();
        public List<SalesReportRowDto>    Trend          { get; set; } = new();
        public List<BranchSalesDto>       ByBranch       { get; set; } = new();
        public List<TopProductReportDto>  TopProducts    { get; set; } = new();
        public List<SaleResponseDto>      Transactions   { get; set; } = new(); // detailed list
    }

    // ── Cashier filter option ──
    public class CashierOptionDto
    {
        public int    Id   { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}
