namespace STMM.Business.DTOs.User
{
    public class EditProfileRequest
    {
        public string Name { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string? BusinessName { get; set; }
    }
}
