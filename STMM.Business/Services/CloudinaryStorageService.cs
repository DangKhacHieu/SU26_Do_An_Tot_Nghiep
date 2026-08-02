using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using STMM.Business.Interfaces;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class CloudinaryStorageService : IFileStorageService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryStorageService(IConfiguration config)
        {
            var cloudName = config["Cloudinary:CloudName"] ?? throw new ArgumentNullException("Cloudinary:CloudName configuration is missing.");
            var apiKey = config["Cloudinary:ApiKey"] ?? throw new ArgumentNullException("Cloudinary:ApiKey configuration is missing.");
            var apiSecret = config["Cloudinary:ApiSecret"] ?? throw new ArgumentNullException("Cloudinary:ApiSecret configuration is missing.");
            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
        }

        public async Task<string> UploadImageAsync(Stream fileStream, string fileName, string folder = "mhms/misc", CancellationToken ct = default)
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, fileStream),
                Folder = folder
            };

            var result = await _cloudinary.UploadAsync(uploadParams, ct);

            if (result.Error != null)
                throw new Exception($"Cloudinary upload failed: {result.Error.Message}");

            return result.SecureUrl.ToString();
        }

        public async Task DeleteImageAsync(string imageUrl, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(imageUrl)) return;

            try
            {
                var uri = new Uri(imageUrl);
                var path = uri.AbsolutePath; // e.g. /v1234567/mhms/issues/abc.jpg
                var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);

                // Find where folder starts (after version string or upload)
                int startIndex = -1;
                for (int i = 0; i < segments.Length; i++)
                {
                    if (segments[i].StartsWith("v") && long.TryParse(segments[i].Substring(1), out _))
                    {
                        startIndex = i + 1;
                        break;
                    }
                }

                if (startIndex == -1 || startIndex >= segments.Length)
                {
                    // Fallback: look for upload segment
                    for (int i = 0; i < segments.Length; i++)
                    {
                        if (segments[i] == "upload")
                        {
                            startIndex = i + 1;
                            if (startIndex < segments.Length && segments[startIndex].StartsWith("v")) startIndex++;
                            break;
                        }
                    }
                }

                if (startIndex != -1 && startIndex < segments.Length)
                {
                    var publicIdWithExt = string.Join("/", segments[startIndex..]);
                    var publicId = Path.ChangeExtension(publicIdWithExt, null);

                    var deletionParams = new DeletionParams(publicId);
                    await _cloudinary.DestroyAsync(deletionParams);
                }
            }
            catch
            {
                // Best-effort cleanup, ignore error
            }
        }
    }
}
