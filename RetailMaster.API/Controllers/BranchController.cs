using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POSSystem.DTOs;
using POSSystem.Services;

namespace POSSystem.Controllers
{
    [ApiController]
    [Route("api/branches")]
    [Authorize]
    public class BranchController : ControllerBase
    {
        private readonly BranchService _branches;
        public BranchController(BranchService branches) => _branches = branches;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _branches.GetAllAsync());

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var r = await _branches.GetByIdAsync(id);
            return r == null ? NotFound(new { message = "Branch not found." }) : Ok(r);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(BranchCreateDto dto)
        {
            var (ok, msg, data) = await _branches.CreateAsync(dto);
            return ok ? Ok(data) : BadRequest(new { message = msg });
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, BranchUpdateDto dto)
        {
            var (ok, msg) = await _branches.UpdateAsync(id, dto);
            return ok ? Ok(new { message = msg }) : BadRequest(new { message = msg });
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var (ok, msg) = await _branches.DeleteAsync(id);
            return ok ? Ok(new { message = msg }) : BadRequest(new { message = msg });
        }

        // POST /api/branches/{id}/regenerate-code — Admin can refresh invite code
        [HttpPost("{id:int}/regenerate-code")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RegenerateCode(int id)
        {
            var (ok, msg, code) = await _branches.RegenerateCodeAsync(id);
            return ok ? Ok(new { inviteCode = code }) : BadRequest(new { message = msg });
        }

        // GET /api/branches/validate-invite/{code} — Public (Register page preview)
        [HttpGet("validate-invite/{code}")]
        [AllowAnonymous]
        public async Task<IActionResult> ValidateInvite(string code)
        {
            var r = await _branches.ValidateInviteCodeAsync(code);
            return r == null ? NotFound(new { message = "Invalid invite code." }) : Ok(r);
        }

        [HttpPut("{id:int}/toggle-online")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> ToggleOnlineOrders(int id, [FromBody] bool acceptsOnline)
{
    var (ok, msg) = await _branches.ToggleOnlineOrdersAsync(id, acceptsOnline);
    return ok ? Ok(new { message = msg }) : BadRequest(new { message = msg });
}
    }
}