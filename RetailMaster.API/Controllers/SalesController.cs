using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POSSystem.DTOs;
using POSSystem.Services;

namespace POSSystem.Controllers
{
    [ApiController]
    [Route("api/sales")]
    [Authorize]
    public class SalesController : ControllerBase
    {
        private readonly SaleService _sales;
        public SalesController(SaleService sales) => _sales = sales;

        [HttpPost]
        public async Task<IActionResult> CreateSale(CreateSaleDto dto)
        {
            var (success, message, data) = await _sales.CreateSaleAsync(dto);
            return success ? Ok(data) : BadRequest(new { message });
        }

        // Fix 1: GetRecentSalesAsync now accepts optional branchId
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentSales(
            [FromQuery] int take = 20,
            [FromQuery] int? branchId = null) =>
            Ok(await _sales.GetRecentSalesAsync(take, branchId));

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _sales.GetByIdAsync(id);
            return result == null ? NotFound(new { message = "Sale not found." }) : Ok(result);
        }

        // Fix 2: uses GetByInvoiceNoAsync — make sure SaleService has this method
        [HttpGet("invoice/{invoiceNo}")]
        public async Task<IActionResult> GetByInvoice(string invoiceNo)
        {
            var result = await _sales.GetByInvoiceNoAsync(invoiceNo);
            return result == null ? NotFound(new { message = "Invoice not found." }) : Ok(result);
        }
    }
}