using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.User;
using STMM.Business.Interfaces;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                throw new System.UnauthorizedAccessException("User ID not found in token.");
            }
            return userId;
        }

        /// <summary>
        /// Lấy thông tin cá nhân của người dùng hiện tại
        /// </summary>
        [HttpGet("profile/me")]
        public async Task<IActionResult> GetMyProfile(CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _userService.GetUserByIdAsync(userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Cập nhật thông tin cá nhân của người dùng hiện tại
        /// </summary>
        [HttpPut("profile/me")]
        public async Task<IActionResult> UpdateMyProfile(
            [FromBody] EditProfileRequest request,
            CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _userService.UpdateProfileAsync(userId, request, ct);
            return Ok(result);
        }

        /// <summary>
        /// Thay đổi mật khẩu
        /// </summary>
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(
            [FromBody] ChangePasswordRequest request,
            CancellationToken ct)
        {
            var userId = GetUserId();
            await _userService.ChangePasswordAsync(userId, request, ct);
            return Ok(new { message = "Đổi mật khẩu thành công." });
        }

        /// <summary>
        /// Cập nhật thông tin cá nhân của người dùng (dành cho Admin)
        /// </summary>
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile(
            [FromQuery] int userId,
            [FromBody] EditProfileRequest request,
            CancellationToken ct)
        {
            var result = await _userService.UpdateProfileAsync(userId, request, ct);
            return Ok(result);
        }
    }
}
