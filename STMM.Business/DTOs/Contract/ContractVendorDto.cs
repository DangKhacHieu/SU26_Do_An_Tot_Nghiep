namespace STMM.Business.DTOs.Contract
{
    public class ContractVendorDto
    {
        public int UserId { get; set; }
        public int VendorId { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Cccd { get; set; } = null!;
        public string? BusinessName { get; set; }
        public string? TaxCode { get; set; }
        public string? Address { get; set; }
        public string? BankAccount { get; set; }
        public string? BankName { get; set; }
    }
}
