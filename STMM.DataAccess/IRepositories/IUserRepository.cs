using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IUserRepository : IBaseRepository<User>
    {
        /// <summary>
        /// Tìm người dùng theo email
        /// </summary>
        Task<User?> GetUserByEmailAsync(string email, CancellationToken ct = default);
    }
}
