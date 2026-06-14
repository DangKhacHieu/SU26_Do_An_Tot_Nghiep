namespace STMM.Business.DTOs.Contract
{
    public class UpdateContractVendorInfoRequest
    {
        public string? BusinessName { get; set; }
        public string? TaxCode { get; set; }
        public string? BankAccount { get; set; }
        public string? BankName { get; set; }
        public string? Address { get; set; }
    }
}
