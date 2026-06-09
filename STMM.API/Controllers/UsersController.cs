using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.User;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Cập nhật thông tin cá nhân của người dùng
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
