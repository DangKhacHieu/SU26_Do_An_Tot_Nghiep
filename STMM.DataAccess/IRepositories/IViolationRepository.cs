using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IViolationRepository : IBaseRepository<Violation>
    {
        Task<(IEnumerable<Violation> Items, int TotalCount)> GetViolationsPagedAsync(
            int userId,
            string? status,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default);

        Task<Violation?> GetViolationWithStallAsync(int id, int userId, CancellationToken ct = default);

        Task<(IEnumerable<Violation> Items, int TotalCount)> GetViolationsPagedForManagerAsync(
            string? status,
            string? searchTerm,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default);

        Task<Violation?> GetViolationDetailsForManagerAsync(int id, CancellationToken ct = default);

        Task<bool> SimulateViolationAppealAsync(int violationId, CancellationToken ct = default);
    }
}
