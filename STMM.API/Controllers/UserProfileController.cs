using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Profile;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/accountant/profile")]
    public class UserProfileController : ControllerBase
    {
        private readonly IUserProfileService _profileService;

        public UserProfileController(IUserProfileService profileService)
        {
            _profileService = profileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile([FromQuery] int userId, CancellationToken ct)
        {
            var result = await _profileService.GetProfileAsync(userId, ct);
            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromQuery] int userId, [FromBody] UpdateProfileRequest request, CancellationToken ct)
        {
            var result = await _profileService.UpdateProfileAsync(userId, request, ct);
            return Ok(result);
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromQuery] int userId, [FromBody] ChangePasswordRequest request, CancellationToken ct)
        {
            var result = await _profileService.ChangePasswordAsync(userId, request, ct);
            return Ok(result);
        }
    }
}
