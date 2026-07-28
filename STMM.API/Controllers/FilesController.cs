using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.Interfaces;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/files")]
    [Authorize]
    public class FilesController : ControllerBase
    {
        private readonly IFileStorageService _fileStorage;

        public FilesController(IFileStorageService fileStorage)
        {
            _fileStorage = fileStorage;
        }

        /// <summary>
        /// Upload an image file, returns the public URL.
        /// </summary>
        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file, CancellationToken ct)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file provided.");

            if (file.Length > 5 * 1024 * 1024) // 5MB limit
                return BadRequest("File size must not exceed 5MB.");

            // Generic security check: restrict to standard image extensions and MIME-types.
            // This endpoint is reusable by Violations, Tasks, and Meter Readings.
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension) || !file.ContentType.StartsWith("image/"))
            {
                return BadRequest("Only image files (.jpg, .jpeg, .png, .webp) are allowed.");
            }

            using var stream = file.OpenReadStream();
            var url = await _fileStorage.UploadImageAsync(stream, file.FileName, ct);

            return Ok(new { imageUrl = url });
        }
    }
}
