namespace STMM.Business.Interfaces
{
    public interface IFileStorageService
    {
        Task<string> UploadImageAsync(Stream fileStream, string fileName, string folder = "mhms/misc", CancellationToken ct = default);
        Task DeleteImageAsync(string imageUrl, CancellationToken ct = default);
    }
}
