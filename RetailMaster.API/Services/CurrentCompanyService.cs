using System.Security.Claims;

namespace POSSystem.Services
{
    public interface ICurrentCompanyService
    {
        int    CompanyId { get; }
        int    UserId    { get; }
        string Role      { get; }
        int?   BranchId  { get; }  // null = Admin (no restriction), value = Cashier branch lock
        bool   IsAdmin   { get; }
    }

    public class CurrentCompanyService : ICurrentCompanyService
    {
        private readonly IHttpContextAccessor _http;
        public CurrentCompanyService(IHttpContextAccessor http) => _http = http;

        public int CompanyId
        {
            get
            {
                var v = _http.HttpContext?.User?.FindFirstValue("companyId");
                return int.TryParse(v, out var id) ? id : 0;
            }
        }

        public int UserId
        {
            get
            {
                var v = _http.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
                return int.TryParse(v, out var id) ? id : 0;
            }
        }

        public string Role =>
            _http.HttpContext?.User?.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

        // null  → Admin (JWT has no branchId claim)
        // value → Cashier (JWT contains branchId claim)
        public int? BranchId
        {
            get
            {
                var v = _http.HttpContext?.User?.FindFirstValue("branchId");
                return int.TryParse(v, out var id) ? id : null;
            }
        }

        public bool IsAdmin => Role == "Admin";
    }
}