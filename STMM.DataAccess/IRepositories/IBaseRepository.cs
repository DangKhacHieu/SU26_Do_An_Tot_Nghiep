using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.IRepositories
{
    public interface IBaseRepository<T> where T : class
    {
        Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default);
        
        Task<T?> GetByIdAsync(object id, CancellationToken cancellationToken = default);
        
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
        
        Task AddAsync(T entity, CancellationToken cancellationToken = default);
        Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
        
        void Update(T entity);
        
        void Delete(T entity);
        
        IQueryable<T> Query();

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
