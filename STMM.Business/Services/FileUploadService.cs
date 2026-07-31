using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class FileUploadService : IFileUploadService
    {
        private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5MB
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
        private readonly IFileStorageService _storageService;
        private readonly ILogger<FileUploadService> _logger;

        public FileUploadService(IFileStorageService storageService, ILogger<FileUploadService> logger)
        {
            _storageService = storageService;
            _logger = logger;
        }

        public async Task<string> UploadImageAsync(IFormFile? file, string contextFolder, CancellationToken ct = default)
        {
            ValidateSingleFile(file);

            var folder = $"mhms/{contextFolder}";
            using var stream = file!.OpenReadStream();
            return await _storageService.UploadImageAsync(stream, file.FileName, folder, ct);
        }

        public async Task<List<string>> UploadImagesAsync(IEnumerable<IFormFile>? files, string contextFolder, int maxFiles = 3, CancellationToken ct = default)
        {
            var fileList = files?.Where(f => f != null && f.Length > 0).ToList() ?? new List<IFormFile>();

            if (fileList.Count == 0)
            {
                return new List<string>();
            }

            if (fileList.Count > maxFiles)
            {
                throw new BadRequestException($"A maximum of {maxFiles} evidence images is allowed.");
            }

            foreach (var file in fileList)
            {
                ValidateSingleFile(file);
            }

            var folder = $"mhms/{contextFolder}";
            var uploadedUrls = new List<string>();

            try
            {
                foreach (var file in fileList)
                {
                    using var stream = file.OpenReadStream();
                    var url = await _storageService.UploadImageAsync(stream, file.FileName, folder, ct);
                    uploadedUrls.Add(url);
                }

                return uploadedUrls;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed while uploading multiple images. Cleaning up {Count} uploaded assets.", uploadedUrls.Count);
                await DeleteImagesAsync(uploadedUrls, ct);
                throw;
            }
        }

        public async Task DeleteImageAsync(string? imageUrl, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(imageUrl)) return;

            try
            {
                await _storageService.DeleteImageAsync(imageUrl, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cleanup image asset: {ImageUrl}", imageUrl);
            }
        }

        public async Task DeleteImagesAsync(IEnumerable<string>? imageUrls, CancellationToken ct = default)
        {
            if (imageUrls == null) return;

            foreach (var url in imageUrls)
            {
                await DeleteImageAsync(url, ct);
            }
        }

        private static void ValidateSingleFile(IFormFile? file)
        {
            if (file == null || file.Length == 0)
            {
                throw new BadRequestException("No file provided.");
            }

            if (file.Length > MaxFileSizeBytes)
            {
                throw new BadRequestException("File size must not exceed 5MB.");
            }

            var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant();
            if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
            {
                throw new BadRequestException("Only image files (.jpg, .jpeg, .png, .webp) are allowed.");
            }
        }
    }
}
