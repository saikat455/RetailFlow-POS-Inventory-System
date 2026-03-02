using System.Security.Claims;
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
        private readonly SaleService _saleService;

        public SalesController(SaleService saleService)
        {
            _saleService = saleService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateSale(CreateSaleDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized(new { message = "Invalid token." });

            var (success, message, data) = await _saleService.CreateSaleAsync(dto, userId);
            if (!success) return BadRequest(new { message });
            return Ok(data);
        }

        [HttpGet("recent")]
        public async Task<IActionResult> GetRecent([FromQuery] int take = 20)
        {
            var sales = await _saleService.GetRecentSalesAsync(take);
            return Ok(sales);
        }
    }
}
