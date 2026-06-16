namespace STMM.Business.DTOs.Contract
{
    public class ContractFileDto
    {
        public int ContractFileId { get; set; }
        public int ContractId { get; set; }
        public string FileUrl { get; set; } = null!;
    }
}
