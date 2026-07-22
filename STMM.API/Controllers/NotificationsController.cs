using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Notification;
using STMM.Business.Interfaces;
using System.Security.Claims;

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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications(
            CancellationToken ct)
        {
            var result = await _notificationService.GetNotificationsForUserAsync(
                GetUserId(), ct);
            return Ok(result);
        }

        [HttpPut("{notiId}/read")]
        public async Task<IActionResult> MarkAsRead(
            [FromRoute] int notiId,
            CancellationToken ct)
        {
            await _notificationService.MarkAsReadAsync(notiId, GetUserId(), ct);
            return NoContent();
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
        {
            await _notificationService.MarkAllAsReadAsync(GetUserId(), ct);
            return NoContent();
        }

        [HttpDelete("{notiId}")]
        public async Task<IActionResult> Delete(
            [FromRoute] int notiId,
            CancellationToken ct)
        {
            await _notificationService.DeleteAsync(notiId, GetUserId(), ct);
            return NoContent();
        }

        private int GetUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(userId, out var parsedUserId)
                ? parsedUserId
                : throw new UnauthorizedAccessException("Invalid user identity.");
        }
    }
}
