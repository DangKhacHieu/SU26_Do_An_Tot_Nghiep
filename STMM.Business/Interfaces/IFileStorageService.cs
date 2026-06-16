namespace STMM.Business.Interfaces
{
    public interface IFileStorageService
    {
        Task<string> UploadImageAsync(Stream fileStream, string fileName, CancellationToken ct = default);
    }
}
