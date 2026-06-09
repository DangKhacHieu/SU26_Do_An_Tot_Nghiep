namespace STMM.Business.DTOs.Auth
{
    public class RegisterResponse
    {
        public bool RequiresVerification { get; set; }
        public string Email { get; set; } = null!;
        public string Message { get; set; } = null!;
    }
}
