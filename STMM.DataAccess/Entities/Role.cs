using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Role
{
    /// <summary>
    /// Mã định danh vai trò hệ thống
    /// </summary>
    public int RoleId { get; set; }

    /// <summary>
    /// Tên vai trò (Admin, Manager, Accountant, Staff, Vendor, Customer)
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Mô tả chi tiết phạm vi quyền hạn
    /// </summary>
    public string? Description { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
