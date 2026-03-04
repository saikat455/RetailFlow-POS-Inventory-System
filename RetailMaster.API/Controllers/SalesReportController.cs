using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POSSystem.DTOs;
using POSSystem.Services;

namespace POSSystem.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize]
    public class SalesReportController : ControllerBase
    {
        private readonly SalesReportService _report;
        public SalesReportController(SalesReportService report) => _report = report;

        // GET /api/reports/sales?from=2024-01-01&to=2024-01-31&branchId=1&cashierId=2&groupBy=day
        [HttpGet("sales")]
        public async Task<IActionResult> GetSalesReport([FromQuery] SalesReportFilterDto filter) =>
            Ok(await _report.GetReportAsync(filter));

        // GET /api/reports/cashiers — for filter dropdown
        [HttpGet("cashiers")]
        public async Task<IActionResult> GetCashiers() =>
            Ok(await _report.GetCashiersAsync());
    }
}
