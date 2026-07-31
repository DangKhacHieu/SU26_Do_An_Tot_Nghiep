using System.Collections.Generic;

namespace STMM.Business.DTOs.Contract
{
    public class AttachContractFilesRequest
    {
        public List<Microsoft.AspNetCore.Http.IFormFile>? Files { get; set; }
    }
}
