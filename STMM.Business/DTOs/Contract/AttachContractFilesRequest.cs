using System.Collections.Generic;

namespace STMM.Business.DTOs.Contract
{
    public class AttachContractFilesRequest
    {
        public List<string> FileUrls { get; set; } = new List<string>();
    }
}
