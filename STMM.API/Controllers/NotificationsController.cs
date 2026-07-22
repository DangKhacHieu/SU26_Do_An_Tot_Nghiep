using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using STMM.Business.DTOs.Notification;
using STMM.Business.Interfaces;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        private int GetUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdStr, out int userId))
            {
                return userId;
            }
            return 0;
        }

        private string GetUserRole()
        {
            return User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        }

        /// <summary>
        /// Lấy danh sách thông báo theo userId và roleName từ Token
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications(CancellationToken ct)
        {
            int userId = GetUserId();
            if (userId == 0) return Unauthorized();

            string roleName = GetUserRole();
            var result = await _notificationService.GetNotificationsForUserAsync(userId, roleName, ct);
            return Ok(result);
        }

        /// <summary>
        /// Đánh dấu thông báo đã đọc
        /// </summary>
        [HttpPut("{notiId}/read")]
        public async Task<IActionResult> MarkAsRead([FromRoute] int notiId, CancellationToken ct)
        {
            // (Thực tế nên kiểm tra xem thông báo này có thuộc về user hiện tại không để bảo mật)
            await _notificationService.MarkAsReadAsync(notiId, ct);
            return NoContent();
        }

        /// <summary>
        /// Đánh dấu tất cả thông báo của người dùng là đã đọc
        /// </summary>
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
        {
            int userId = GetUserId();
            if (userId == 0) return Unauthorized();

            string roleName = GetUserRole();
            await _notificationService.MarkAllAsReadAsync(userId, roleName, ct);
            return NoContent();
        }

        /// <summary>
        /// Xóa thông báo
        /// </summary>
        [HttpDelete("{notiId}")]
        public async Task<IActionResult> Delete([FromRoute] int notiId, CancellationToken ct)
        {
            int userId = GetUserId();
            if (userId == 0) return Unauthorized();

            string roleName = GetUserRole();
            await _notificationService.DeleteAsync(notiId, userId, roleName, ct);
            return NoContent();
        }
    }
}
