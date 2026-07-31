using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    public interface IFileUploadService
    {
        Task<string> UploadImageAsync(IFormFile? file, string contextFolder, CancellationToken ct = default);
        Task<List<string>> UploadImagesAsync(IEnumerable<IFormFile>? files, string contextFolder, int maxFiles = 3, CancellationToken ct = default);
        Task DeleteImageAsync(string? imageUrl, CancellationToken ct = default);
        Task DeleteImagesAsync(IEnumerable<string>? imageUrls, CancellationToken ct = default);
    }
}
