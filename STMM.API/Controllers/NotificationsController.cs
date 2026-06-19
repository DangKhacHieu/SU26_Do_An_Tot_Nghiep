using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Notification;
using STMM.Business.Interfaces;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        /// <summary>
        /// Lấy danh sách thông báo theo userId và roleName
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications(
            [FromQuery] int userId,
            [FromQuery] string? roleName,
            CancellationToken ct)
        {
            var result = await _notificationService.GetNotificationsForUserAsync(userId, roleName, ct);
            return Ok(result);
        }

        /// <summary>
        /// Đánh dấu thông báo đã đọc
        /// </summary>
        [HttpPut("{notiId}/read")]
        public async Task<IActionResult> MarkAsRead([FromRoute] int notiId, CancellationToken ct)
        {
            await _notificationService.MarkAsReadAsync(notiId, ct);
            return NoContent();
        }

        /// <summary>
        /// Đánh dấu tất cả thông báo của người dùng là đã đọc
        /// </summary>
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead(
            [FromQuery] int userId,
            [FromQuery] string? roleName,
            CancellationToken ct)
        {
            await _notificationService.MarkAllAsReadAsync(userId, roleName, ct);
            return NoContent();
        }

        /// <summary>
        /// Xóa thông báo
        /// </summary>
        [HttpDelete("{notiId}")]
        public async Task<IActionResult> Delete([FromRoute] int notiId, CancellationToken ct)
        {
            await _notificationService.DeleteAsync(notiId, ct);
            return NoContent();
        }
    }
}
