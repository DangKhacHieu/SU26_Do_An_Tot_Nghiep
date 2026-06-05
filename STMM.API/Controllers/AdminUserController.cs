using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.User;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/admin/users")]
    public class AdminUserController : ControllerBase
    {
        private readonly IUserService _userService;

        public AdminUserController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Get all users in the system (all roles, role-unrestricted by default).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? roleName,
            [FromQuery] string? search,
            CancellationToken ct)
        {
            var users = await _userService.GetAdminUsersAsync(roleName, search, ct);
            return Ok(users);
        }

        /// <summary>
        /// Get all roles in the system (all roles, role-unrestricted).
        /// </summary>
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles(CancellationToken ct)
        {
            var roles = await _userService.GetAdminRolesAsync(ct);
            return Ok(roles);
        }

        /// <summary>
        /// Get detailed profile information of a specific user.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id, CancellationToken ct)
        {
            var user = await _userService.GetUserByIdAsync(id, ct);
            return Ok(user);
        }

        /// <summary>
        /// Register any role user in the system.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> RegisterUser(
            [FromBody] CreateUserRequest request,
            CancellationToken ct)
        {
            var result = await _userService.RegisterUserAsync(request, ct);
            return CreatedAtAction(nameof(GetUserById), new { id = result.UserId }, result);
        }

        /// <summary>
        /// Update user details.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(
            int id,
            [FromBody] UpdateUserRequest request,
            CancellationToken ct)
        {
            var result = await _userService.UpdateUserAsync(id, request, ct);
            return Ok(result);
        }

        /// <summary>
        /// Lock or unlock a user account.
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> LockUnlockUser(
            int id,
            [FromBody] UpdateStatusRequest request,
            CancellationToken ct)
        {
            var result = await _userService.LockUnlockUserAsync(id, request.Status, ct);
            return Ok(result);
        }

        /// <summary>
        /// Soft delete a user account.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id, CancellationToken ct)
        {
            await _userService.DeleteUserAsync(id, ct);
            return NoContent();
        }

        /// <summary>
        /// Reset user's password directly.
        /// </summary>
        [HttpPatch("{id}/reset-password")]
        public async Task<IActionResult> ResetPassword(
            int id,
            [FromBody] ResetPasswordRequest request,
            CancellationToken ct)
        {
            var result = await _userService.ResetPasswordAsync(id, request.NewPassword, ct);
            return Ok(result);
        }
    }

    public class ResetPasswordRequest
    {
        public string NewPassword { get; set; } = null!;
    }
}
