using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Content;
using STMM.Business.Interfaces;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/manager/contents")]
    public class ContentController : ControllerBase
    {
        private readonly IContentService _contentService;

        public ContentController(IContentService contentService)
        {
            _contentService = contentService;
        }

        private int? GetUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(claim, out int uid)) return uid;
            return null;
        }

        [HttpGet]
        public async Task<IActionResult> GetContents(
            [FromQuery] string? type,
            [FromQuery] string? targetRole,
            CancellationToken ct)
        {
            var userId = GetUserId();
            var contents = await _contentService.GetContentsAsync(type, targetRole, userId, ct);
            return Ok(contents);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetContentById(int id, CancellationToken ct)
        {
            var userId = GetUserId();
            var content = await _contentService.GetContentByIdAsync(id, userId, ct);
            return Ok(content);
        }

        [HttpPost]
        public async Task<IActionResult> CreateContent(
            [FromBody] CreateContentRequest request,
            CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _contentService.CreateContentAsync(request, userId, ct);
            return CreatedAtAction(nameof(GetContentById), new { id = result.NotiId }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateContent(
            int id,
            [FromBody] UpdateContentRequest request,
            CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _contentService.UpdateContentAsync(id, request, userId, ct);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContent(int id, CancellationToken ct)
        {
            var userId = GetUserId();
            await _contentService.DeleteContentAsync(id, userId, ct);
            return NoContent();
        }
    }
}
