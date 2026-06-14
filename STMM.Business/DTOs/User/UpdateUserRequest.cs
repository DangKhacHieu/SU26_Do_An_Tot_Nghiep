namespace STMM.Business.DTOs.User
{
    public class UpdateUserRequest
    {
        public int RoleId { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Cccd { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? Password { get; set; }
    }
}
