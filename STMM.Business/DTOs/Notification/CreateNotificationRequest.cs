namespace STMM.Business.DTOs.Notification
{
    /// <summary>
    /// Internal DTO used by services to create notifications.
    /// Not exposed directly via API controllers.
    /// </summary>
    public class CreateNotificationRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;

        /// <summary>
        /// Notification type: "System", "Invoice", "Violation", "Request"
        /// </summary>
        public string NotiType { get; set; } = "System";

        /// <summary>
        /// UserId of the creator (current Staff user)
        /// </summary>
        public int CreatedByUserId { get; set; }

        /// <summary>
        /// Send to a specific user. Null if sending by role. (XOR with TargetRole)
        /// </summary>
        public int? TargetUserId { get; set; }

        /// <summary>
        /// Send to an entire role. Null if sending to a specific user. (XOR with TargetUserId)
        /// </summary>
        public string? TargetRole { get; set; }
    }
}
