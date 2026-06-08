using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Content;
using STMM.Business.Interfaces;
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

        [HttpGet]
        public async Task<IActionResult> GetContents(
            [FromQuery] string? type,
            [FromQuery] string? targetRole,
            CancellationToken ct)
        {
            var contents = await _contentService.GetContentsAsync(type, targetRole, ct);
            return Ok(contents);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetContentById(int id, CancellationToken ct)
        {
            var content = await _contentService.GetContentByIdAsync(id, ct);
            return Ok(content);
        }

        [HttpPost]
        public async Task<IActionResult> CreateContent(
            [FromBody] CreateContentRequest request,
            CancellationToken ct)
        {
            var result = await _contentService.CreateContentAsync(request, ct);
            return CreatedAtAction(nameof(GetContentById), new { id = result.NotiId }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateContent(
            int id,
            [FromBody] UpdateContentRequest request,
            CancellationToken ct)
        {
            var result = await _contentService.UpdateContentAsync(id, request, ct);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContent(int id, CancellationToken ct)
        {
            await _contentService.DeleteContentAsync(id, ct);
            return NoContent();
        }
    }
}
