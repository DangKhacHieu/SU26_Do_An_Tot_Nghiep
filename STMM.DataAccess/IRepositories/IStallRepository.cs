using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IStallRepository : IBaseRepository<Stall>
    {
        Task<(IEnumerable<Stall> Items, int TotalCount)> GetStallTasksPagedAsync(
            int staffUserId,
            string? search,
            string? filter,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default);
    }
}
