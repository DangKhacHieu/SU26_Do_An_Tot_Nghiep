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
    }
}
