using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IViolationRepository : IBaseRepository<Violation>
    {
        Task<IReadOnlyList<Violation>> GetViolationsForStaffAsync(
            int userId,
            CancellationToken ct = default);

        Task<Violation?> GetViolationWithStallAsync(int id, int userId, CancellationToken ct = default);

        Task<(IEnumerable<Violation> Items, int TotalCount)> GetViolationsPagedForManagerAsync(
            int marketId,
            string? status,
            string? searchTerm,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default);

        Task<Violation?> GetViolationDetailsForManagerAsync(int id, int marketId, CancellationToken ct = default);

        Task<bool> SimulateViolationAppealAsync(int violationId, CancellationToken ct = default);

        Task<(IEnumerable<Violation> Items, int TotalCount)> GetViolationsForVendorPagedAsync(
            int vendorId,
            int? stallId,
            string? status,
            string? searchTerm,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default);

        Task<Violation?> GetViolationDetailForVendorAsync(int id, int vendorId, CancellationToken ct = default);

        Task<decimal> GetTotalFinesAsync(DateTime startDate, DateTime endDate, int? marketId = null, CancellationToken ct = default);

        Task<IEnumerable<Violation>> GetAllViolationsWithDetailsAsync(int? marketId = null, CancellationToken ct = default);

        Task<bool> IsViolationTypeInUseAsync(int violationTypeId, CancellationToken ct = default);
        Task<List<Violation>> GetUnpaidViolationsByStallIdAsync(int stallId, CancellationToken ct = default);
    }
}
