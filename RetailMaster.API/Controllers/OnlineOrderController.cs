using Microsoft.AspNetCore.Mvc;
using POSSystem.DTOs;
using POSSystem.Services;

namespace POSSystem.Controllers
{
    [ApiController]
    [Route("api/online")]
    public class OnlineOrderController : ControllerBase
    {
        private readonly OnlineOrderService _onlineOrder;

        public OnlineOrderController(OnlineOrderService onlineOrder)
        {
            _onlineOrder = onlineOrder;
        }

        /// <summary>
        /// Get all branches that accept online orders
        /// </summary>
        [HttpGet("branches")]
        public async Task<IActionResult> GetBranches()
        {
            var branches = await _onlineOrder.GetBranchesAsync();
            return Ok(branches);
        }

        /// <summary>
        /// Get products for a specific branch (public)
        /// </summary>
        [HttpGet("branches/{branchId}/products")]
        public async Task<IActionResult> GetBranchProducts(int branchId)
        {
            var products = await _onlineOrder.GetBranchProductsAsync(branchId);
            return Ok(products);
        }

        /// <summary>
        /// Place a new online order
        /// </summary>
        [HttpPost("orders")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOnlineOrderDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Invalid order data." });

            var (success, message, data) = await _onlineOrder.CreateOrderAsync(dto);
            
            if (!success)
                return BadRequest(new { message });

            return Ok(data);
        }

        /// <summary>
        /// Track order by order number
        /// </summary>
        [HttpGet("orders/track/{orderNumber}")]
        public async Task<IActionResult> TrackOrder(string orderNumber)
        {
            var order = await _onlineOrder.TrackOrderAsync(orderNumber);
            
            if (order == null)
                return NotFound(new { message = "Order not found." });

            return Ok(order);
        }
    }
}