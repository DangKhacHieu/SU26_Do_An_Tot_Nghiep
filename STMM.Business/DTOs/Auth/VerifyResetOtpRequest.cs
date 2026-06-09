namespace STMM.Business.DTOs.Auth
{
    public class VerifyResetOtpRequest
    {
        public string Email { get; set; } = null!;
        public string Code { get; set; } = null!;
    }
}
