using System;
using System.Threading;
using System.Threading.Tasks;
using STMM.DataAccess.Repositories.Interfaces;

namespace STMM.DataAccess.UnitOfWork
{
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<TEntity> Repository<TEntity>() where TEntity : class;
        
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
