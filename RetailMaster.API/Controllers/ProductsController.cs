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
        private readonly ProductService _productService;

        public ProductsController(ProductService productService)
        {
            _productService = productService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search)
        {
            var products = await _productService.GetAllAsync(search);
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _productService.GetByIdAsync(id);
            if (product == null) return NotFound(new { message = "Product not found." });
            return Ok(product);
        }

        [HttpGet("barcode/{barcode}")]
        public async Task<IActionResult> GetByBarcode(string barcode)
        {
            var product = await _productService.GetByBarcodeAsync(barcode);
            if (product == null) return NotFound(new { message = "Product not found." });
            return Ok(product);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(ProductCreateDto dto)
        {
            var (success, message, data) = await _productService.CreateAsync(dto);
            if (!success) return BadRequest(new { message });
            return CreatedAtAction(nameof(GetById), new { id = data!.Id }, data);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, ProductUpdateDto dto)
        {
            var (success, message) = await _productService.UpdateAsync(id, dto);
            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var (success, message) = await _productService.DeleteAsync(id);
            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }
    }
}
