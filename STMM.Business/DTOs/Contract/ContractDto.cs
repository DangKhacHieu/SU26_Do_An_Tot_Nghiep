using System;
using System.Collections.Generic;

namespace STMM.Business.DTOs.Contract
{
    public class ContractDto
    {
        public int ContractId { get; set; }
        public int StallId { get; set; }
        public string StallCode { get; set; } = null!;
        public double? StallSize { get; set; }
        public string AreaName { get; set; } = null!;
        public string MarketName { get; set; } = null!;
        
        public int VendorId { get; set; }
        public string VendorName { get; set; } = null!;
        public string VendorEmail { get; set; } = null!;
        public string VendorPhone { get; set; } = null!;
        public string VendorCccd { get; set; } = null!;
        public string? VendorAddress { get; set; }
        public string? VendorTaxCode { get; set; }
        public string? VendorBusinessName { get; set; }
        public string? VendorBankAccount { get; set; }
        public string? VendorBankName { get; set; }
        
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public decimal RentFee { get; set; }
        public decimal Deposit { get; set; }
        public string? Status { get; set; }
        public DateTime? CreatedAt { get; set; }
        
        public List<ContractFileDto> ContractFiles { get; set; } = new List<ContractFileDto>();
    }
}
