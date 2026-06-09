namespace STMM.Business.DTOs.Auth
{
    public class VerifyEmailRequest
    {
        public string Email { get; set; } = null!;
        public string Code { get; set; } = null!;
    }
}
