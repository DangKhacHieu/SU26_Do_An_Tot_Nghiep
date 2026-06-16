using System;

namespace STMM.Business.DTOs.Contract
{
    public class RenewContractRequest
    {
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public decimal RentFee { get; set; }
        public decimal Deposit { get; set; }
    }
}
