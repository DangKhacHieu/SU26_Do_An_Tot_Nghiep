using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using STMM.Business.DTOs.Profile;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/accountant/profile")]
    [Authorize(Roles = "Accountant,Admin")]
    public class UserProfileController : ControllerBase
    {
        private readonly IUserProfileService _profileService;

        public UserProfileController(IUserProfileService profileService)
        {
            _profileService = profileService;
        }

        private int GetUserId()
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                throw new UnauthorizedAccessException("User ID not found in token.");
            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile(CancellationToken ct)
        {
            var result = await _profileService.GetProfileAsync(GetUserId(), ct);
            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken ct)
        {
            var result = await _profileService.UpdateProfileAsync(GetUserId(), request, ct);
            return Ok(result);
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
        {
            var result = await _profileService.ChangePasswordAsync(GetUserId(), request, ct);
            return Ok(result);
        }
    }
}
