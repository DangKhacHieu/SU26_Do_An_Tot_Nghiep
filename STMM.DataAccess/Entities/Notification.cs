using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Notification
{
    public int NotiId { get; set; }

    public string Title { get; set; } = null!;

    public string Content { get; set; } = null!;

    public string? NotiType { get; set; }

    public int CreatedBy { get; set; }

    public string? TargetRole { get; set; }

    public int? TargetUserId { get; set; }

    public bool? IsRead { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User CreatedByNavigation { get; set; } = null!;

    public virtual User? TargetUser { get; set; }
}
