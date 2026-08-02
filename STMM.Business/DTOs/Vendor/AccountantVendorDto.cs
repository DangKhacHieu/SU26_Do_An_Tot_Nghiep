using System;
using System.Collections.Generic;

namespace STMM.Business.DTOs.Vendor
{
    public class AccountantVendorDto
    {
        public int VendorId { get; set; }
        public string BusinessName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? TaxCode { get; set; }
        public string? BankAccount { get; set; }
        public string? BankName { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<string> RegisteredServices { get; set; } = new List<string>();
        public List<string> StallCodes { get; set; } = new List<string>();
    }
}
