using System;

namespace STMM.Business.DTOs.Auth
{
    public class PendingUserDto
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Cccd { get; set; } = null!;
        public string OtpCode { get; set; } = null!;
        public DateTime OtpExpiredAt { get; set; }
    }
}
