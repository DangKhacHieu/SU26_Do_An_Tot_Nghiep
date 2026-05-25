using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class ContractFile
{
    public int Id { get; set; }

    public int ContractId { get; set; }

    public string FileUrl { get; set; } = null!;

    public virtual Contract Contract { get; set; } = null!;
}
