using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class StaffTask
{
    public int TaskId { get; set; }

    public int AssignedTo { get; set; }

    public int? RequestId { get; set; }

    public string TaskType { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string? Status { get; set; }

    public DateTime Deadline { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User AssignedToNavigation { get; set; } = null!;

    public virtual Request? Request { get; set; }
}
