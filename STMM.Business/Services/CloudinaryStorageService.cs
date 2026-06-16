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

        public async Task<string> UploadImageAsync(Stream fileStream, string fileName, CancellationToken ct = default)
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, fileStream),
                Folder = "mhms/meter-readings"
            };

            var result = await _cloudinary.UploadAsync(uploadParams, ct);

            if (result.Error != null)
                throw new Exception($"Cloudinary upload failed: {result.Error.Message}");

            return result.SecureUrl.ToString();
        }
    }
}
