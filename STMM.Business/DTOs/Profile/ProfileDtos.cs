using System;

namespace STMM.Business.DTOs.Profile
{
    public class UserProfileDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Cccd { get; set; } = null!;
        public int RoleId { get; set; }
        public string RoleName { get; set; } = null!;
        public string Department { get; set; } = null!;
        public string Office { get; set; } = null!;
        public string? Avatar { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Phone { get; set; } = null!;
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }
}
