namespace POSSystem.DTOs
{
    public class DashboardDto
    {
        public decimal TodaySales { get; set; }
        public decimal TodayProfit { get; set; }
        public int TodayTransactions { get; set; }
        public int LowStockCount { get; set; }
        public List<LowStockItemDto> LowStockItems { get; set; } = new();
        public List<TopProductDto> TopProducts { get; set; } = new();
        public List<SalesTrendDto> SalesTrend { get; set; } = new();
    }

    public class LowStockItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int StockQty { get; set; }
        public int LowStockThreshold { get; set; }
    }

    public class TopProductDto
    {
        public string Name { get; set; } = string.Empty;
        public int TotalQtySold { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class SalesTrendDto
    {
        public string Date { get; set; } = string.Empty;
        public decimal Sales { get; set; }
        public decimal Profit { get; set; }
    }
}
