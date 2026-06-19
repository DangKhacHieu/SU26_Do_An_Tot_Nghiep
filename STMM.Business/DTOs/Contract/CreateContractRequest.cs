using System;

namespace STMM.Business.DTOs.Contract
{
    public class CreateContractRequest
    {
        public int StallId { get; set; }
        public int UserId { get; set; } // The target vendor's user id
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public decimal RentFee { get; set; }
        public decimal Deposit { get; set; }
        public string? BusinessName { get; set; }
        public string? TaxCode { get; set; }
        public string? BankAccount { get; set; }
        public string? BankName { get; set; }
    }
}
