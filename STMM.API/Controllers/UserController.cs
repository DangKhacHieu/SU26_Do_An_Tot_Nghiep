using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.User;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/manager/users")]
    [Authorize(Roles = "Manager")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IUserRepository _userRepository;

        public UserController(IUserService userService, IUserRepository userRepository)
        {
            _userService = userService;
            _userRepository = userRepository;
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(claim, out int userId))
            {
                return userId;
            }
            return null;
        }

        /// <summary>
        /// Get list of users with optional filtering by role and search query (name/email/phone/cccd).
        /// Only returns manageable roles: Staff, Accountant, Vendor, Customer in the Manager's market.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? roleName,
            [FromQuery] string? search,
            CancellationToken ct)
        {
            var currentUserId = GetUserId();
            var users = await _userService.GetUsersAsync(roleName, search, currentUserId, ct);
            return Ok(users);
        }

        /// <summary>
        /// Get available manageable roles (Staff, Accountant, Vendor, Customer).
        /// </summary>
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles(CancellationToken ct)
        {
            var roles = await _userService.GetRolesAsync(ct);
            return Ok(roles);
        }

        /// <summary>
        /// Get detailed profile information of a specific user.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id, CancellationToken ct)
        {
            var currentUserId = GetUserId();
            var user = await _userService.GetUserByIdAsync(id, currentUserId, ct);
            return Ok(user);
        }

        /// <summary>
        /// Register a new user in the system.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> RegisterUser(
            [FromBody] CreateUserRequest request,
            CancellationToken ct)
        {
            var currentUserId = GetUserId();
            var result = await _userService.RegisterUserAsync(request, currentUserId, ct);
            return CreatedAtAction(nameof(GetUserById), new { id = result.UserId }, result);
        }

        /// <summary>
        /// Update information of an existing user.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(
            int id,
            [FromBody] UpdateUserRequest request,
            CancellationToken ct)
        {
            var currentUserId = GetUserId();
            var result = await _userService.UpdateUserAsync(id, request, currentUserId, ct);
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
            var currentUserId = GetUserId();
            var result = await _userService.LockUnlockUserAsync(id, request.Status, currentUserId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Soft delete a user account.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id, CancellationToken ct)
        {
            var currentUserId = GetUserId();
            await _userService.DeleteUserAsync(id, currentUserId, ct);
            return NoContent();
        }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = null!;
    }
}
