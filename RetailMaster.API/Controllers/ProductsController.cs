using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POSSystem.DTOs;
using POSSystem.Services;

namespace POSSystem.Controllers
{
    [ApiController]
    [Route("api/products")]
    [Authorize]
    public class ProductsController : ControllerBase
    {
        private readonly ProductService _products;
        public ProductsController(ProductService products) => _products = products;

        // GET /api/products?branchId=1&search=cola
        // Cashier calls this — returns only their branch's products with branch stock
        [HttpGet]
        public async Task<IActionResult> GetForBranch(
            [FromQuery] int branchId,
            [FromQuery] string? search = null) =>
            Ok(await _products.GetForBranchAsync(branchId, search));

        // GET /api/products/catalogue?search=cola
        // Admin only — full catalogue with per-branch stocks
        [HttpGet("catalogue")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetCatalogue([FromQuery] string? search = null) =>
            Ok(await _products.GetCatalogueAsync(search));

        // GET /api/products/barcode/{barcode}?branchId=1
        [HttpGet("barcode/{barcode}")]
        public async Task<IActionResult> GetByBarcode(string barcode, [FromQuery] int branchId)
        {
            var r = await _products.GetByBarcodeForBranchAsync(barcode, branchId);
            return r == null ? NotFound(new { message = "Product not found in this branch." }) : Ok(r);
        }

        // POST /api/products — add to catalogue (Admin only)
        // After this, use /assign-stock to add to branches
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(ProductCreateDto dto)
        {
            var (ok, msg, data) = await _products.CreateAsync(dto);
            return ok ? Ok(data) : BadRequest(new { message = msg });
        }

        // PUT /api/products/{id} — update catalogue info
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, ProductUpdateDto dto)
        {
            var (ok, msg) = await _products.UpdateAsync(id, dto);
            return ok ? Ok(new { message = msg }) : BadRequest(new { message = msg });
        }

        // POST /api/products/assign-stock
        // Adds a product to a branch with initial stock qty
        [HttpPost("assign-stock")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignStock(AssignStockDto dto)
        {
            var (ok, msg) = await _products.AssignStockAsync(dto);
            return ok ? Ok(new { message = msg }) : BadRequest(new { message = msg });
        }

        // PUT /api/products/{productId}/stock/{branchId}
        // Adjust qty or threshold for a specific branch
        [HttpPut("{productId:int}/stock/{branchId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdjustStock(int productId, int branchId, AdjustStockDto dto)
        {
            var (ok, msg) = await _products.AdjustStockAsync(productId, branchId, dto);
            return ok ? Ok(new { message = msg }) : BadRequest(new { message = msg });
        }

        // DELETE /api/products/{productId}/branch/{branchId}
        // Remove product from one branch only (stays in catalogue)
        [HttpDelete("{productId:int}/branch/{branchId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveFromBranch(int productId, int branchId)
        {
            var (ok, msg) = await _products.RemoveFromBranchAsync(productId, branchId);
            return ok ? Ok(new { message = msg }) : BadRequest(new { message = msg });
        }

        // DELETE /api/products/{id}
        // Delete from catalogue + all branches
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var (ok, msg) = await _products.DeleteAsync(id);
            return ok ? Ok(new { message = msg }) : BadRequest(new { message = msg });
        }
    }
}