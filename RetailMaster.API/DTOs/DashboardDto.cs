namespace POSSystem.DTOs
{
    public class DashboardDto
    {
        public decimal           TodayRevenue      { get; set; }
        public decimal           TodayProfit       { get; set; }
        public int               TodayTransactions { get; set; }
        public int               LowStockCount     { get; set; }
        public List<LowStockItemDto>  LowStockItems { get; set; } = new();
        public List<TopProductDto>    TopProducts   { get; set; } = new();
        public List<TrendDayDto>      Trend         { get; set; } = new();
    }

    public class LowStockItemDto
    {
        public int    ProductId   { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string BranchName  { get; set; } = string.Empty; // which branch has low stock
        public int    StockQty    { get; set; }
        public int    Threshold   { get; set; }
    }

    public class TopProductDto
    {
        public string  ProductName { get; set; } = string.Empty;
        public int     QtySold     { get; set; }
        public decimal Revenue     { get; set; }
    }

    public class TrendDayDto
    {
        public string  Date         { get; set; } = string.Empty;
        public decimal TotalSales   { get; set; }
        public int     Transactions { get; set; }
    }
}