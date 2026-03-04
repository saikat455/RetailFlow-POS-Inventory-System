using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POSSystem.Services;

namespace POSSystem.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly DashboardService _dashboard;

        public DashboardController(DashboardService dashboard) => _dashboard = dashboard;

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            // CompanyId scoped inside DashboardService via ICurrentCompanyService
            var result = await _dashboard.GetAsync();
            return Ok(result);
        }
    }
}