using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Faq;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/manager/faqs")]
    public class FaqController : ControllerBase
    {
        private readonly IFaqService _faqService;

        public FaqController(IFaqService faqService)
        {
            _faqService = faqService;
        }

        [HttpGet]
        public async Task<IActionResult> GetFaqs(
            [FromQuery] string? category,
            [FromQuery] bool? isActive,
            CancellationToken ct)
        {
            var faqs = await _faqService.GetFaqsAsync(category, isActive, ct);
            return Ok(faqs);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFaqById(int id, CancellationToken ct)
        {
            var faq = await _faqService.GetFaqByIdAsync(id, ct);
            return Ok(faq);
        }

        [HttpPost]
        public async Task<IActionResult> CreateFaq(
            [FromBody] CreateFaqRequest request,
            CancellationToken ct)
        {
            var result = await _faqService.CreateFaqAsync(request, ct);
            return CreatedAtAction(nameof(GetFaqById), new { id = result.FaqId }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFaq(
            int id,
            [FromBody] UpdateFaqRequest request,
            CancellationToken ct)
        {
            var result = await _faqService.UpdateFaqAsync(id, request, ct);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFaq(int id, CancellationToken ct)
        {
            await _faqService.DeleteFaqAsync(id, ct);
            return NoContent();
        }
    }
}
