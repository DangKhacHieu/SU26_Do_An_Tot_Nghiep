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
    }
}
