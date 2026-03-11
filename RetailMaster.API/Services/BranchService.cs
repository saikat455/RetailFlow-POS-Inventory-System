using Microsoft.EntityFrameworkCore;
using POSSystem.Data;
using POSSystem.DTOs;
using POSSystem.Models;

namespace POSSystem.Services
{
    public class BranchService
    {
        private readonly AppDbContext            _db;
        private readonly ICurrentCompanyService  _ctx;

        public BranchService(AppDbContext db, ICurrentCompanyService ctx)
        {
            _db = db; _ctx = ctx;
        }

        // Admin → all branches in company
        // Cashier → only their assigned branch
        private IQueryable<Branch> ScopedBranches
        {
            get
            {
                var q = _db.Branches
                    .Where(b => b.CompanyId == _ctx.CompanyId && !b.IsDeleted);

                if (!_ctx.IsAdmin && _ctx.BranchId.HasValue)
                    q = q.Where(b => b.Id == _ctx.BranchId.Value);

                return q;
            }
        }

     public async Task<List<BranchResponseDto>> GetAllAsync()
{
    var branches = await ScopedBranches.OrderBy(b => b.Name).ToListAsync();
    var ids      = branches.Select(b => b.Id).ToList();

    var saleCounts = await _db.Sales
        .Where(s => s.CompanyId == _ctx.CompanyId && !s.IsDeleted && ids.Contains(s.BranchId!.Value))
        .GroupBy(s => s.BranchId)
        .Select(g => new { BranchId = g.Key, Count = g.Count() })
        .ToListAsync();

    var userCounts = await _db.Users
        .Where(u => u.CompanyId == _ctx.CompanyId && !u.IsDeleted && u.BranchId.HasValue && ids.Contains(u.BranchId!.Value))
        .GroupBy(u => u.BranchId)
        .Select(g => new { BranchId = g.Key, Count = g.Count() })
        .ToListAsync();

    return branches.Select(b => new BranchResponseDto
    {
        Id         = b.Id,
        Name       = b.Name,
        Address    = b.Address,
        Phone      = b.Phone,
        IsDefault  = b.IsDefault,
        InviteCode = _ctx.IsAdmin ? b.InviteCode : string.Empty,
        SaleCount  = saleCounts.FirstOrDefault(x => x.BranchId == b.Id)?.Count ?? 0,
        UserCount  = userCounts.FirstOrDefault(x => x.BranchId == b.Id)?.Count ?? 0,
        CreatedAt  = b.CreatedAt,
        AcceptsOnlineOrders = b.AcceptsOnlineOrders // New
    }).ToList();
}

        public async Task<BranchResponseDto?> GetByIdAsync(int id)
        {
            var b = await ScopedBranches.FirstOrDefaultAsync(x => x.Id == id);
            if (b == null) return null;
            return new BranchResponseDto
            {
                Id         = b.Id, Name = b.Name, Address = b.Address,
                Phone      = b.Phone, IsDefault = b.IsDefault,
                InviteCode = _ctx.IsAdmin ? b.InviteCode : string.Empty,
                CreatedAt  = b.CreatedAt,
            };
        }

        public async Task<(bool ok, string msg, BranchResponseDto? data)> CreateAsync(BranchCreateDto dto)
{
    if (!_ctx.IsAdmin) return (false, "Admins only.", null);
    var companyId = _ctx.CompanyId;

    if (await _db.Branches.AnyAsync(b => b.CompanyId == companyId && !b.IsDeleted && b.Name == dto.Name.Trim()))
        return (false, "A branch with this name already exists.", null);

    if (dto.IsDefault) await ClearDefaultAsync(companyId);

    // Generate unique branch invite code
    string code;
    do { code = GenerateCode(); }
    while (await _db.Branches.AnyAsync(b => b.InviteCode == code));

    var branch = new Branch
    {
        CompanyId  = companyId,
        Name       = dto.Name.Trim(),
        Address    = dto.Address?.Trim(),
        Phone      = dto.Phone?.Trim(),
        IsDefault  = dto.IsDefault,
        InviteCode = code,
        AcceptsOnlineOrders = dto.AcceptsOnlineOrders // New
    };
    _db.Branches.Add(branch);
    await _db.SaveChangesAsync();

    return (true, "Branch created.", new BranchResponseDto
    {
        Id = branch.Id, 
        Name = branch.Name, 
        Address = branch.Address,
        Phone = branch.Phone, 
        IsDefault = branch.IsDefault,
        InviteCode = branch.InviteCode, 
        CreatedAt = branch.CreatedAt,
        AcceptsOnlineOrders = branch.AcceptsOnlineOrders // New
    });
}

       public async Task<(bool ok, string msg)> UpdateAsync(int id, BranchUpdateDto dto)
{
    if (!_ctx.IsAdmin) return (false, "Admins only.");
    var companyId = _ctx.CompanyId;

    var branch = await _db.Branches
        .FirstOrDefaultAsync(b => b.Id == id && b.CompanyId == companyId && !b.IsDeleted);
    if (branch == null) return (false, "Branch not found.");

    if (dto.Name.Trim() != branch.Name &&
        await _db.Branches.AnyAsync(b => b.CompanyId == companyId && !b.IsDeleted && b.Name == dto.Name.Trim() && b.Id != id))
        return (false, "A branch with this name already exists.");

    if (dto.IsDefault && !branch.IsDefault) await ClearDefaultAsync(companyId);

    branch.Name      = dto.Name.Trim();
    branch.Address   = dto.Address?.Trim();
    branch.Phone     = dto.Phone?.Trim();
    branch.IsDefault = dto.IsDefault;
    branch.AcceptsOnlineOrders = dto.AcceptsOnlineOrders; // New
    branch.UpdatedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();
    return (true, "Branch updated.");
}

        public async Task<(bool ok, string msg)> DeleteAsync(int id)
        {
            if (!_ctx.IsAdmin) return (false, "Admins only.");
            var companyId = _ctx.CompanyId;

            var branch = await _db.Branches
                .FirstOrDefaultAsync(b => b.Id == id && b.CompanyId == companyId && !b.IsDeleted);
            if (branch == null) return (false, "Branch not found.");
            if (branch.IsDefault) return (false, "Cannot delete the default branch.");
            if (await _db.Sales.AnyAsync(s => s.BranchId == id && s.CompanyId == companyId))
                return (false, "Cannot delete a branch that has sales records.");

            branch.IsDeleted = true;
            branch.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Branch deleted.");
        }

        // Regenerate invite code for a branch (Admin only)
        public async Task<(bool ok, string msg, string? code)> RegenerateCodeAsync(int id)
        {
            if (!_ctx.IsAdmin) return (false, "Admins only.", null);

            var branch = await _db.Branches
                .FirstOrDefaultAsync(b => b.Id == id && b.CompanyId == _ctx.CompanyId && !b.IsDeleted);
            if (branch == null) return (false, "Branch not found.", null);

            string code;
            do { code = GenerateCode(); }
            while (await _db.Branches.AnyAsync(b => b.InviteCode == code));

            branch.InviteCode = code;
            branch.UpdatedAt  = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Invite code regenerated.", code);
        }

        // Public — validate branch invite code for Register page preview
        public async Task<BranchPublicDto?> ValidateInviteCodeAsync(string code)
        {
            var branch = await _db.Branches
                .Include(b => b.Company)
                .FirstOrDefaultAsync(b => b.InviteCode == code.ToUpper().Trim()
                                       && !b.IsDeleted
                                       && b.Company!.IsActive
                                       && !b.Company.IsDeleted);
            if (branch == null) return null;
            return new BranchPublicDto
            {
                CompanyName = branch.Company!.Name,
                BranchName  = branch.Name,
            };
        }

        private async Task ClearDefaultAsync(int companyId)
        {
            var defaults = await _db.Branches
                .Where(b => b.CompanyId == companyId && b.IsDefault && !b.IsDeleted)
                .ToListAsync();
            foreach (var b in defaults) { b.IsDefault = false; b.UpdatedAt = DateTime.UtcNow; }
        }

        private static string GenerateCode()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            var rng = new Random();
            return new string(Enumerable.Range(0, 6)
                .Select(_ => chars[rng.Next(chars.Length)]).ToArray());
        }

        // Add this method to get branches for online ordering
public async Task<List<OnlineBranchDto>> GetOnlineBranchesAsync()
{
    return await _db.Branches
        .Where(b => b.CompanyId == _ctx.CompanyId 
            && !b.IsDeleted 
            && b.AcceptsOnlineOrders)
        .OrderBy(b => b.Name)
        .Select(b => new OnlineBranchDto
        {
            Id = b.Id,
            Name = b.Name,
            Address = b.Address,
            Phone = b.Phone,
            AcceptsOnlineOrders = b.AcceptsOnlineOrders
        })
        .ToListAsync();
}

/// <summary>
/// Toggle online orders acceptance for a branch
/// </summary>
public async Task<(bool ok, string msg)> ToggleOnlineOrdersAsync(int id, bool acceptsOnline)
{
    if (!_ctx.IsAdmin) return (false, "Admins only.");
    
    var branch = await _db.Branches
        .FirstOrDefaultAsync(b => b.Id == id && b.CompanyId == _ctx.CompanyId && !b.IsDeleted);
    
    if (branch == null) return (false, "Branch not found.");
    
    branch.AcceptsOnlineOrders = acceptsOnline;
    branch.UpdatedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();
    
    return (true, $"Online orders {(acceptsOnline ? "enabled" : "disabled")} for {branch.Name}.");
}
    }


}