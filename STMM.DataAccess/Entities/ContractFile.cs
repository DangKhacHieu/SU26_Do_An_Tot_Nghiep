using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class ContractFile
{
    /// <summary>
    /// Mã bản ghi file hợp đồng
    /// </summary>
    public int ContractFileId { get; set; }

    /// <summary>
    /// Thuộc hợp đồng nào
    /// </summary>
    public int ContractId { get; set; }

    /// <summary>
    /// Link file hợp đồng scan (PDF/Image)
    /// </summary>
    public string FileUrl { get; set; } = null!;

    public virtual Contract Contract { get; set; } = null!;
}
