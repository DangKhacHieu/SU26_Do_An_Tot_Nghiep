namespace STMM.Business.DTOs
{
    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;

        public int UserId { get; set; }

        public int RoleId { get; set; }

        public string? Name { get; set; }

        public string Email { get; set; } = string.Empty;

        public string? Status { get; set; }
    }
}