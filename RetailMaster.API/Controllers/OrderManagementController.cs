using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POSSystem.DTOs;
using POSSystem.Services;

namespace POSSystem.Controllers
{
    [ApiController]
    [Route("api/orders")]
    [Authorize]
    public class OrderManagementController : ControllerBase
    {
        private readonly OrderManagementService _orderManagement;

        public OrderManagementController(OrderManagementService orderManagement)
        {
            _orderManagement = orderManagement;
        }

        /// <summary>
        /// Get orders for current branch (cashier) or all branches (admin)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetBranchOrders([FromQuery] string? status = null)
        {
            var orders = await _orderManagement.GetBranchOrdersAsync(status);
            return Ok(orders);
        }

        /// <summary>
        /// Get order details by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var order = await _orderManagement.GetOrderByIdAsync(id);
            if (order == null)
                return NotFound(new { message = "Order not found." });
            
            // Mark as notified when viewed
            await _orderManagement.MarkAsNotifiedAsync(id);
            
            return Ok(order);
        }

        /// <summary>
        /// Update order status (accept, ready, out-for-delivery, deliver, cancel)
        /// </summary>
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Invalid request." });

            var (success, message, data) = await _orderManagement.UpdateOrderStatusAsync(id, dto);
            
            if (!success)
                return BadRequest(new { message });

            return Ok(data);
        }

        /// <summary>
        /// Get new orders (for notifications)
        /// </summary>
        [HttpGet("new")]
        public async Task<IActionResult> GetNewOrders()
        {
            var newOrders = await _orderManagement.GetNewOrdersAsync();
            return Ok(newOrders);
        }

        /// <summary>
        /// Get order statistics for dashboard
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetOrderStats()
        {
            var stats = await _orderManagement.GetOrderStatsAsync();
            return Ok(stats);
        }
    }
}